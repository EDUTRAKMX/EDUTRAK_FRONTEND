import { Routes } from '@angular/router';
import {
  authChildGuard,
  authGuard,
  guestGuard,
  homeRedirectGuard,
  passwordChangeGuard,
  roleChildGuard,
  roleGuard,
} from './core/auth/auth.guards';
import { UI_ROLES, UiRole } from './core/auth/role.model';
import { ROLE_NAVIGATION, navPathsFor } from './core/navigation/nav.config';

/**
 * Rutas por rol bajo el shell. Fase 1: `inicio` carga la pantalla temporal de demostración y el
 * resto de destinos del menú carga un marcador. Las fases 3 a 6 sustituyen cada `loadComponent`
 * por la pantalla real. Fase 2: cada shell exige sesión activa (`authGuard`) y el rol de la ruta (`roleGuard`).
 */
function roleRoutes(role: UiRole): Routes {
  const { basePath } = ROLE_NAVIGATION[role];
  return [
    {
      path: basePath.slice(1),
      data: { role },
      canActivate: [authGuard, roleGuard],
      canActivateChild: [authChildGuard, roleChildGuard],
      loadComponent: () => import('./layouts/shell/shell.layout').then((m) => m.ShellLayout),
      children: [
        { path: '', pathMatch: 'full', redirectTo: 'inicio' },
        ...navPathsFor(role).map((entry) =>
          entry.path === 'inicio'
            ? {
                path: entry.path,
                title: `${entry.label} · EDUTRAK`,
                loadComponent: () => import('./features/demo/demo.page').then((m) => m.DemoPage),
              }
            : {
                path: entry.path,
                title: `${entry.label} · EDUTRAK`,
                data: { title: entry.label },
                loadComponent: () => import('./features/demo/placeholder.page').then((m) => m.PlaceholderPage),
              },
        ),
      ],
    },
  ];
}

export const routes: Routes = [
  // La raíz y las rutas desconocidas llevan al inicio del rol de la sesión, o al login si no hay sesión.
  { path: '', pathMatch: 'full', canActivate: [homeRedirectGuard], children: [] },
  {
    path: 'login',
    title: 'Iniciar sesión · EDUTRAK',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/identity/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'cambiar-contrasena',
    title: 'Cambiar contraseña · EDUTRAK',
    canActivate: [passwordChangeGuard],
    loadComponent: () =>
      import('./features/identity/change-password/change-password.page').then((m) => m.ChangePasswordPage),
  },
  {
    path: 'acceso-denegado',
    title: 'Acceso denegado · EDUTRAK',
    loadComponent: () => import('./features/identity/access-denied/access-denied.page').then((m) => m.AccessDeniedPage),
  },
  ...UI_ROLES.flatMap(roleRoutes),
  { path: '**', canActivate: [homeRedirectGuard], children: [] },
];
