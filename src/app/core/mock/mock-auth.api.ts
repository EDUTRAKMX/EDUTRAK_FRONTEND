import { Injectable } from '@angular/core';
import { Observable, defer, map, timer } from 'rxjs';
import { AuthApi, AuthError, SessionHint } from '../auth/auth.api';
import { passwordRuleViolation } from '../auth/auth.validators';
import { AuthResult, ChangePasswordRequest, LoginRequest } from '../../shared/models/auth.model';
import { User } from '../../shared/models/user.model';
import { MOCK_ACCOUNTS, MockAccount } from './fixtures/users.fixture';
import { MOCK_LATENCY_MS } from './simulate-latency';

/** Vida del access token (el backend usa 15 min por defecto). */
const ACCESS_TTL_MS = 15 * 60_000;
/** Vida máxima de una sesión demo: el refresh NO la extiende (permite probar la expiración). */
const SESSION_MAX_MS = 30 * 60_000;
/** Intentos fallidos por cuenta antes de responder 429 (el backend limita por cuenta+IP y por IP). */
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

interface RefreshEntry {
  readonly userId: string;
  readonly sessionEndsAt: number;
}

/**
 * Implementación SIMULADA de `AuthApi`. Todo el estado vive en memoria: recargar la página lo
 * reinicia (contraseñas cambiadas, bloqueos). Los tokens son cadenas opacas que no sirven en ningún sitio.
 * Se registra únicamente con `environment.mockAuth` (ver `provideAuth`).
 */
@Injectable()
export class MockAuthApi implements AuthApi {
  private readonly passwords = new Map<string, string>(MOCK_ACCOUNTS.map((a) => [a.user.id, a.password]));
  private readonly mustChange = new Set<string>(
    MOCK_ACCOUNTS.filter((a) => a.user.must_change_password).map((a) => a.user.id),
  );
  private readonly refreshTokens = new Map<string, RefreshEntry>();
  private readonly failures = new Map<string, { count: number; lockedUntil: number }>();
  private activeUserId: string | null = null;

  login(request: LoginRequest): Observable<AuthResult> {
    return this.respond(() => {
      const number = request.institutional_number;
      const now = Date.now();
      const failure = this.failures.get(number);
      if (failure && failure.lockedUntil > now) {
        throw new AuthError(429, 'rate_limited', 'too many failed attempts', Math.ceil((failure.lockedUntil - now) / 1000));
      }
      const account = MOCK_ACCOUNTS.find((a) => a.user.institutional_number === number);
      if (!account || this.passwords.get(account.user.id) !== request.password) {
        const expiredLock = failure !== undefined && failure.lockedUntil > 0 && failure.lockedUntil <= now;
        const count = (expiredLock ? 0 : (failure?.count ?? 0)) + 1;
        this.failures.set(number, { count, lockedUntil: count >= MAX_FAILED_ATTEMPTS ? now + LOCK_SECONDS * 1000 : 0 });
        // Misma respuesta para contraseña incorrecta y cuenta inexistente (como el backend).
        throw new AuthError(401, 'invalid_credentials', 'invalid institutional number or password');
      }
      this.failures.delete(number);
      this.activeUserId = account.user.id;
      return this.issue(account, now + SESSION_MAX_MS);
    });
  }

  refresh(refreshToken: string): Observable<AuthResult> {
    return this.respond(() => {
      const entry = this.refreshTokens.get(refreshToken);
      this.refreshTokens.delete(refreshToken); // un solo uso
      if (!entry || Date.now() >= entry.sessionEndsAt) {
        throw new AuthError(401, 'invalid_refresh_token', 'invalid or expired refresh token');
      }
      return this.issue(this.accountById(entry.userId), entry.sessionEndsAt);
    });
  }

  logout(): Observable<void> {
    return this.respond(() => {
      this.activeUserId = null;
      this.refreshTokens.clear();
    });
  }

  me(): Observable<User> {
    return this.respond(() => this.currentUser(this.requireActive()));
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.respond(() => {
      const account = this.requireActive();
      if (this.passwords.get(account.user.id) !== request.current_password) {
        throw new AuthError(401, 'invalid_credentials', 'current password is incorrect');
      }
      if (passwordRuleViolation(request.new_password)) {
        throw new AuthError(422, 'weak_password', 'password does not meet the length rules');
      }
      if (request.new_password === request.current_password) {
        throw new AuthError(422, 'same_password', 'new password must differ from the current one');
      }
      this.passwords.set(account.user.id, request.new_password);
      this.mustChange.delete(account.user.id);
    });
  }

  restore(hint: SessionHint): Observable<AuthResult | null> {
    return this.respond(() => {
      const account = MOCK_ACCOUNTS.find((a) => a.user.id === hint.userId);
      const endsAt = Date.parse(hint.refreshExpiresAt);
      if (!account || !(endsAt > Date.now())) return null;
      // La pista solo puede dar por completado un cambio obligatorio; nunca lo impone ni concede roles.
      if (!hint.mustChangePassword) this.mustChange.delete(account.user.id);
      this.activeUserId = account.user.id;
      return this.issue(account, endsAt);
    });
  }

  /** Evalúa `produce` tras la latencia simulada; si lanza, el observable emite error. */
  private respond<T>(produce: () => T): Observable<T> {
    return defer(() => timer(MOCK_LATENCY_MS)).pipe(map(produce));
  }

  private issue(account: MockAccount, sessionEndsAt: number): AuthResult {
    const now = Date.now();
    const refreshToken = `mock-refresh.${crypto.randomUUID()}`;
    this.refreshTokens.set(refreshToken, { userId: account.user.id, sessionEndsAt });
    return {
      token_type: 'Bearer',
      access_token: `mock-access.${crypto.randomUUID()}`,
      access_expires_at: new Date(Math.min(now + ACCESS_TTL_MS, sessionEndsAt)).toISOString(),
      refresh_token: refreshToken,
      refresh_expires_at: new Date(sessionEndsAt).toISOString(),
      user: this.currentUser(account),
    };
  }

  private currentUser(account: MockAccount): User {
    return { ...account.user, must_change_password: this.mustChange.has(account.user.id) };
  }

  private accountById(id: string): MockAccount {
    const account = MOCK_ACCOUNTS.find((a) => a.user.id === id);
    if (!account) throw new AuthError(401, 'unauthenticated', 'missing or invalid access token');
    return account;
  }

  private requireActive(): MockAccount {
    if (!this.activeUserId) throw new AuthError(401, 'unauthenticated', 'missing or invalid access token');
    return this.accountById(this.activeUserId);
  }
}
