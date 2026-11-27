import { Injectable, computed, signal } from '@angular/core';
import { User } from '../../shared/models/user.model';
import { UiRole } from './role.model';
import { primaryUiRole, uiRolesOf } from './role-routing';

/**
 * Sesión en memoria. Los tokens viven SOLO aquí (nunca en localStorage/sessionStorage);
 * recargar la página los pierde, igual que haría el cliente real con el refresh token en memoria.
 */
export interface Session {
  readonly user: User;
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Epoch ms. */
  readonly accessExpiresAt: number;
  /** Epoch ms. Fin de la vida máxima de la sesión. */
  readonly refreshExpiresAt: number;
}

/** Estado de sesión (Signals). La lógica de login/logout/expiración está en `AuthService`. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _session = signal<Session | null>(null);

  readonly session = this._session.asReadonly();
  readonly user = computed(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly mustChangePassword = computed(() => this._session()?.user.must_change_password === true);
  /** Roles con interfaz a los que el usuario puede entrar (ADMIN no tiene interfaz todavía). */
  readonly uiRoles = computed<readonly UiRole[]>(() => {
    const user = this.user();
    return user ? uiRolesOf(user) : [];
  });
  readonly primaryRole = computed<UiRole | null>(() => {
    const user = this.user();
    return user ? primaryUiRole(user) : null;
  });

  set(session: Session): void {
    this._session.set(session);
  }

  updateUser(user: User): void {
    this._session.update((s) => (s ? { ...s, user } : s));
  }

  clear(): void {
    this._session.set(null);
  }
}
