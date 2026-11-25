import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResult, ChangePasswordRequest, LoginRequest } from '../../shared/models/auth.model';
import { User } from '../../shared/models/user.model';

/**
 * Error de autenticación con la forma del backend (`{error:{code,message}}` + estado HTTP).
 * Lo lanzan tanto el mock como la futura implementación HTTP, para que la UI no distinga entre ambos.
 */
export class AuthError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Segundos de espera (cabecera `Retry-After` en 429). */
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Pista no secreta de la sesión demo guardada por la persistencia (nunca contiene tokens ni contraseñas). */
export interface SessionHint {
  readonly userId: string;
  readonly mustChangePassword: boolean;
  /** RFC 3339 UTC: la restauración nunca extiende la vida máxima de la sesión demo. */
  readonly refreshExpiresAt: string;
}

/**
 * Puerto de autenticación: refleja los endpoints de identidad del backend
 * (`/api/auth/login|refresh|logout|me|password`). Las pantallas y guards solo conocen esta interfaz.
 * La implementación mock vive en core/mock; la HTTP (futura) en core/http.
 */
export interface AuthApi {
  /** POST /api/auth/login. Errores: 401 `invalid_credentials`, 429 `rate_limited`. */
  login(request: LoginRequest): Observable<AuthResult>;
  /** POST /api/auth/refresh. El refresh token es de un solo uso: la respuesta trae un par nuevo. */
  refresh(refreshToken: string): Observable<AuthResult>;
  /** POST /api/auth/logout. */
  logout(): Observable<void>;
  /** GET /api/auth/me. */
  me(): Observable<User>;
  /** PATCH /api/auth/password. Errores: 401 `invalid_credentials`, 422 `weak_password` | `same_password`. */
  changePassword(request: ChangePasswordRequest): Observable<void>;
  /**
   * Restaura una sesión tras recargar la página. Solo tiene sentido en la demo (el backend real no
   * persiste tokens en el navegador): una implementación HTTP puede devolver siempre `null`.
   */
  restore(hint: SessionHint): Observable<AuthResult | null>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');

/** Cuenta de demostración que la pantalla de login puede mostrar (solo con `mockAuth`). */
export interface DemoAccountHint {
  readonly label: string;
  readonly institutionalNumber: string;
  readonly password: string;
  readonly note?: string;
}

/** Vacío salvo en entornos con `mockAuth`: la UI no importa fixtures, solo este token. */
export const DEMO_ACCOUNT_HINTS = new InjectionToken<readonly DemoAccountHint[]>('DEMO_ACCOUNT_HINTS', {
  providedIn: 'root',
  factory: () => [],
});
