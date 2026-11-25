import { Routes } from '@angular/router';
import { UI_ROLES, UiRole } from './core/auth/role.model';
import { ROLE_NAVIGATION, navPathsFor } from './core/navigation/nav.config';

/**
 * Rutas por rol bajo el shell. Fase 1: `inicio` carga la pantalla temporal de demostración y el
 * resto de destinos del menú carga un marcador. Las fases 3 a 6 sustituyen cada `loadComponent`
 * por la pantalla real. Los guards por rol/sesión llegan en la Fase 2.
 */
function roleRoutes(role: UiRole): Routes {
  const { basePath } = ROLE_NAVIGATION[role];
  return [
    {
      path: basePath.slice(1),
      data: { role },
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
  // Fase 1: sin login todavía; la raíz abre el shell del Alumno. En la Fase 2 redirigirá a /login.
  { path: '', pathMatch: 'full', redirectTo: 'alumno/inicio' },
  ...UI_ROLES.flatMap(roleRoutes),
  { path: '**', redirectTo: 'alumno/inicio' },
];
