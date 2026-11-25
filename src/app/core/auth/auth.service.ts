import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { AuthResult, ChangePasswordRequest, LoginRequest } from '../../shared/models/auth.model';
import { User } from '../../shared/models/user.model';
import { AUTH_API } from './auth.api';
import { AUTH_PATHS } from './role-routing';
import { SESSION_PERSISTENCE } from './session-persistence';
import { SessionStore } from './session.store';

/** Se renueva el access token este tiempo antes de que expire. */
const REFRESH_LEAD_MS = 30_000;

export type SessionStatus = 'active' | 'none' | 'expired';

/**
 * Fachada de autenticación: orquesta el puerto `AUTH_API`, el store, la persistencia demo y la
 * expiración. No sabe si detrás hay un mock o HTTP.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AUTH_API);
  private readonly store = inject(SessionStore);
  private readonly persistence = inject(SESSION_PERSISTENCE);
  private readonly router = inject(Router);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly _signingOut = signal(false);
  readonly signingOut = this._signingOut.asReadonly();

  login(request: LoginRequest): Observable<User> {
    return this.api.login(request).pipe(
      tap((result) => this.start(result)),
      map((result) => result.user),
    );
  }

  /** Cierra la sesión local siempre, aunque el servidor no responda, y vuelve al login. */
  signOut(): void {
    if (this._signingOut()) return;
    this._signingOut.set(true);
    this.api
      .logout()
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => {
        this.end();
        this._signingOut.set(false);
        void this.router.navigateByUrl(AUTH_PATHS.login);
      });
  }

  /** Sesión vencida: limpia el estado y lleva al login indicando el motivo. */
  expire(): void {
    this.end();
    void this.router.navigate([AUTH_PATHS.login], { queryParams: { motivo: 'expirada' } });
  }

  /**
   * Estado actual de la sesión. Si venció (p. ej. el equipo estuvo suspendido y el temporizador no
   * corrió), la limpia y lo informa para que el guard redirija con el motivo correcto.
   */
  sessionStatus(): SessionStatus {
    const session = this.store.session();
    if (!session) return 'none';
    if (Date.now() >= session.refreshExpiresAt) {
      this.end();
      return 'expired';
    }
    return 'active';
  }

  /** PATCH /auth/password y luego /auth/me: así `must_change_password` queda limpio en la sesión. */
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.api.changePassword(request).pipe(
      switchMap(() => this.api.me()),
      tap((user) => this.updateUser(user)),
      map(() => undefined),
    );
  }

  /** Restauración controlada tras recargar (solo si hay una pista válida; en producción nunca la hay). */
  restore(): Promise<void> {
    const hint = this.persistence.read();
    if (!hint || Date.parse(hint.refreshExpiresAt) <= Date.now()) {
      this.persistence.clear();
      return Promise.resolve();
    }
    return firstValueFrom(this.api.restore(hint).pipe(catchError(() => of(null)))).then((result) => {
      if (result) this.start(result);
      else this.persistence.clear();
    });
  }

  private start(result: AuthResult): void {
    this.store.set({
      user: result.user,
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      accessExpiresAt: Date.parse(result.access_expires_at),
      refreshExpiresAt: Date.parse(result.refresh_expires_at),
    });
    this.persistHint();
    this.schedule();
  }

  private updateUser(user: User): void {
    this.store.updateUser(user);
    this.persistHint();
  }

  private persistHint(): void {
    const session = this.store.session();
    if (!session) return;
    this.persistence.write({
      userId: session.user.id,
      mustChangePassword: session.user.must_change_password,
      refreshExpiresAt: new Date(session.refreshExpiresAt).toISOString(),
    });
  }

  private end(): void {
    this.cancelTimer();
    this.store.clear();
    this.persistence.clear();
  }

  private cancelTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  /** Programa la renovación silenciosa o, al final de la vida máxima, la expiración. */
  private schedule(): void {
    this.cancelTimer();
    const session = this.store.session();
    if (!session) return;
    const wakeAt =
      session.accessExpiresAt >= session.refreshExpiresAt
        ? session.refreshExpiresAt
        : Math.min(session.accessExpiresAt - REFRESH_LEAD_MS, session.refreshExpiresAt);
    this.timer = setTimeout(() => this.onTimer(), Math.max(wakeAt - Date.now(), 0));
  }

  private onTimer(): void {
    const session = this.store.session();
    if (!session) return;
    if (Date.now() >= session.refreshExpiresAt) {
      this.expire();
      return;
    }
    this.api.refresh(session.refreshToken).subscribe({
      next: (result) => this.start(result),
      error: () => this.expire(),
    });
  }
}
