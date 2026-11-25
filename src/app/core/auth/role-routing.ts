import { Router } from '@angular/router';
import { User } from '../../shared/models/user.model';
import { ROLE_NAVIGATION } from '../navigation/nav.config';
import { UI_ROLE_TO_API, UiRole } from './role.model';

/** Rutas públicas/transversales de autenticación. */
export const AUTH_PATHS = {
  login: '/login',
  changePassword: '/cambiar-contrasena',
  denied: '/acceso-denegado',
} as const;

/** Si una persona tiene varios roles, el inicio es el de mayor jerarquía. */
const ROLE_PRIORITY: readonly UiRole[] = ['director', 'profesor', 'tutor', 'alumno'];

/** Roles con interfaz que el usuario posee según `user.roles` (ADMIN queda fuera: sin interfaz aún). */
export function uiRolesOf(user: Pick<User, 'roles'>): readonly UiRole[] {
  return ROLE_PRIORITY.filter((role) => user.roles.includes(UI_ROLE_TO_API[role]));
}

export function primaryUiRole(user: Pick<User, 'roles'>): UiRole | null {
  return uiRolesOf(user)[0] ?? null;
}

export function homePathFor(role: UiRole): string {
  return `${ROLE_NAVIGATION[role].basePath}/inicio`;
}

/** Solo rutas internas absolutas. Evita redirecciones abiertas (`//host`, `https://…`, `\`). */
export function sanitizeReturnUrl(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  return value;
}

/**
 * Destino tras autenticarse: cambio de contraseña si está pendiente; si no, la `returnUrl` segura
 * cuando pertenece a un rol que la persona posee; si no, el inicio de su rol principal.
 */
export function postLoginUrl(user: User, returnUrl: string | null | undefined, router: Router): string {
  if (user.must_change_password) return AUTH_PATHS.changePassword;

  const roles = uiRolesOf(user);
  const safe = sanitizeReturnUrl(returnUrl);
  if (safe) {
    const first = router.parseUrl(safe).root.children['primary']?.segments[0]?.path;
    if (roles.some((role) => ROLE_NAVIGATION[role].basePath === `/${first}`)) return safe;
  }
  const primary = roles[0];
  return primary ? homePathFor(primary) : `${AUTH_PATHS.denied}?motivo=sin-interfaz`;
}
