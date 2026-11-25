import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AUTH_PATHS, postLoginUrl } from './role-routing';
import { isUiRole } from './role.model';
import { SessionStore } from './session.store';

/**
 * Los guards del frontend solo mejoran la experiencia: la autorización real la decide el backend
 * (rol y relación, 401/403 en cada petición).
 */

/** Exige sesión activa. Sin ella → login (con `returnUrl`); con cambio de contraseña pendiente → esa pantalla. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const status = auth.sessionStatus();
  if (status !== 'active') {
    return router.createUrlTree([AUTH_PATHS.login], {
      queryParams: { returnUrl: state.url, ...(status === 'expired' ? { motivo: 'expirada' } : {}) },
    });
  }
  if (inject(SessionStore).mustChangePassword()) return router.createUrlTree([AUTH_PATHS.changePassword]);
  return true;
};

/** Rol (`data.role`) de la ruta o de cualquiera de sus ancestros (las rutas hijas no heredan `data`). */
function routeRole(route: ActivatedRouteSnapshot): unknown {
  return route.pathFromRoot.map((r) => r.data['role']).find((value) => isUiRole(value));
}

/** Exige que la persona posea el rol de la ruta. Si no, acceso denegado. */
export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const role = routeRole(route);
  if (isUiRole(role) && inject(SessionStore).uiRoles().includes(role)) return true;
  return router.createUrlTree([AUTH_PATHS.denied]);
};

/**
 * Angular no reevalúa `canActivate` del padre al navegar entre hijos: con estas versiones "Child" cada
 * cambio de pantalla dentro del shell vuelve a comprobar sesión vigente, cambio pendiente y rol.
 */
export const authChildGuard: CanActivateChildFn = (route, state) => authGuard(route, state);
export const roleChildGuard: CanActivateChildFn = (route, state) => roleGuard(route, state);

/** Pantallas solo para visitantes (login): con sesión activa redirige a su destino. */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = inject(SessionStore).user();
  if (inject(AuthService).sessionStatus() === 'active' && user) {
    return router.parseUrl(postLoginUrl(user, null, router));
  }
  return true;
};

/** Cambio de contraseña: solo con sesión y únicamente mientras sea obligatorio. */
export const passwordChangeGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = inject(SessionStore).user();
  if (inject(AuthService).sessionStatus() !== 'active' || !user) return router.createUrlTree([AUTH_PATHS.login]);
  if (!user.must_change_password) return router.parseUrl(postLoginUrl(user, null, router));
  return true;
};

/** Raíz y rutas desconocidas: a donde corresponda según la sesión. */
export const homeRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = inject(SessionStore).user();
  if (inject(AuthService).sessionStatus() === 'active' && user) {
    return router.parseUrl(postLoginUrl(user, null, router));
  }
  return router.createUrlTree([AUTH_PATHS.login]);
};
