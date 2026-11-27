import { User } from './user.model';

/** Schema `LoginRequest` de api/openapi.yaml. */
export interface LoginRequest {
  readonly institutional_number: string;
  readonly password: string;
}

/** Schema `AuthResult` de api/openapi.yaml (respuesta de login y refresh). */
export interface AuthResult {
  readonly token_type: 'Bearer';
  readonly access_token: string;
  /** Instante RFC 3339 UTC. */
  readonly access_expires_at: string;
  readonly refresh_token: string;
  readonly refresh_expires_at: string;
  readonly user: User;
}

/** Cuerpo de `PATCH /api/auth/password`. */
export interface ChangePasswordRequest {
  readonly current_password: string;
  readonly new_password: string;
}
