import { Routes } from '@angular/router';

/**
 * Rutas reales del módulo Director (Fase 3), hijas del shell `/director`.
 * Las que aún no existen (Analytics, Alertas, Asignaciones de tutores, Auditoría: sin frames en el alcance)
 * conservan el marcador de la Fase 1. Todas heredan `authGuard`/`roleGuard` del shell.
 */
export const DIRECTOR_ROUTES: Routes = [
  {
    path: 'inicio',
    title: 'Inicio · EDUTRAK',
    loadComponent: () => import('./home/director-home.page').then((m) => m.DirectorHomePage),
  },
  {
    path: 'periodos',
    title: 'Periodos académicos · EDUTRAK',
    loadComponent: () => import('./periods/periods.page').then((m) => m.PeriodsPage),
  },
  {
    path: 'horarios',
    title: 'Horarios · EDUTRAK',
    pathMatch: 'full',
    loadComponent: () => import('./schedules/schedules.page').then((m) => m.SchedulesPage),
  },
  {
    path: 'horarios/:groupId',
    title: 'Horario del grupo · EDUTRAK',
    loadComponent: () => import('./schedules/group-schedule.page').then((m) => m.GroupSchedulePage),
  },
  {
    path: 'grupos',
    title: 'Grupos · EDUTRAK',
    pathMatch: 'full',
    loadComponent: () => import('./groups/groups.page').then((m) => m.GroupsPage),
  },
  {
    path: 'grupos/:groupId',
    title: 'Detalle del grupo · EDUTRAK',
    loadComponent: () => import('./groups/group-detail.page').then((m) => m.GroupDetailPage),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./groups/group-summary.page').then((m) => m.GroupSummaryPage) },
      { path: 'alumnos', loadComponent: () => import('./groups/group-students.page').then((m) => m.GroupStudentsPage) },
      ...['materias', 'profesores', 'asistencia', 'calificaciones', 'alertas'].map((tab) => ({
        path: tab,
        data: { title: tab.charAt(0).toUpperCase() + tab.slice(1) },
        loadComponent: () => import('./groups/group-tab-placeholder.page').then((m) => m.GroupTabPlaceholderPage),
      })),
    ],
  },
];
