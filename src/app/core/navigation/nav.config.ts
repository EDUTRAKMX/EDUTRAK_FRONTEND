import {
  LucideBellRing,
  LucideBookOpen,
  LucideCalendarClock,
  LucideCalendarDays,
  LucideCalendarRange,
  LucideCalendars,
  LucideChartColumn,
  LucideChartNoAxesCombined,
  LucideClipboardCheck,
  LucideClipboardList,
  LucideFileText,
  LucideGraduationCap,
  LucideHouse,
  LucideIconInput,
  LucideSpotlight,
  LucideTriangleAlert,
  LucideUserRoundCheck,
  LucideUserRoundGroup,
  LucideUsers,
} from '@lucide/angular';
import { UiRole } from '../auth/role.model';

export interface NavEntry {
  /** Segmento relativo a `basePath` (p. ej. `horario`). */
  readonly path: string;
  readonly label: string;
  readonly icon: LucideIconInput;
}

export interface NavGroup {
  readonly title: string;
  readonly items: readonly NavEntry[];
}

export interface RoleNavigation {
  readonly role: UiRole;
  readonly basePath: string;
  /** Título de la identidad del rol en el menú móvil (Figma: "Estudiante", "Profesores"…). */
  readonly mobileRoleTitle: string;
  /** Ancho del panel del menú móvil en Figma (312 en Alumno/Tutor, 352 en Profesor/Director). */
  readonly mobileMenuWidth: 312 | 352;
  /** Sidebar de escritorio: grupos con título. */
  readonly desktop: readonly NavGroup[];
  /** Menú móvil: lista plana. Sus etiquetas e iconos difieren de los de escritorio en Figma. */
  readonly mobile: readonly NavEntry[];
}

/*
 * Fuente: Figma.
 *  - Sidebars escritorio: Alumno 134:5466, Profesor 127:830, Director 66:4, Tutor (captura 161:2153).
 *  - Menús móviles: Alumno 225:5196, Profesor 225:4739, Director 225:4956, Tutor 225:5381.
 * Iconos del sidebar de escritorio del Tutor verificados en Figma vía Chrome (nodo 161:2154):
 * user-round-group, spotlight, triangle-alert, chart-column.
 */
const home = (label = 'Inicio'): NavEntry => ({ path: 'inicio', label, icon: LucideHouse });

export const ROLE_NAVIGATION: Readonly<Record<UiRole, RoleNavigation>> = {
  alumno: {
    role: 'alumno',
    basePath: '/alumno',
    mobileRoleTitle: 'Estudiante',
    mobileMenuWidth: 312,
    desktop: [
      { title: 'General', items: [
        home(),
        { path: 'horario', label: 'Horario', icon: LucideCalendarClock },
        { path: 'calificaciones', label: 'Calificaciones', icon: LucideClipboardList },
        { path: 'asistencia', label: 'Asistencia', icon: LucideUserRoundCheck },
      ] },
      { title: 'Seguimiento', items: [
        { path: 'justificantes', label: 'Justificantes', icon: LucideFileText },
      ] },
    ],
    mobile: [
      home(),
      { path: 'horario', label: 'Horario', icon: LucideCalendarDays },
      { path: 'calificaciones', label: 'Mis calificaciones', icon: LucideGraduationCap },
      { path: 'justificantes', label: 'Mis justificaciones', icon: LucideFileText },
      { path: 'asistencia', label: 'Mi asistencia', icon: LucideUserRoundCheck },
    ],
  },
  profesor: {
    role: 'profesor',
    basePath: '/profesor',
    mobileRoleTitle: 'Profesores',
    mobileMenuWidth: 352,
    desktop: [
      { title: 'General', items: [home()] },
      { title: 'Docencia', items: [
        { path: 'grupos', label: 'Mis grupos', icon: LucideUserRoundGroup },
        { path: 'asistencia', label: 'Asistencia', icon: LucideUserRoundCheck },
        { path: 'horario', label: 'Horario', icon: LucideCalendarClock },
        { path: 'calificaciones', label: 'Calificaciones', icon: LucideClipboardList },
      ] },
      { title: 'Seguimiento', items: [
        { path: 'justificantes', label: 'Justificantes', icon: LucideFileText },
      ] },
    ],
    mobile: [
      home(),
      { path: 'grupos', label: 'Mis grupos y materias', icon: LucideBookOpen },
      { path: 'horario', label: 'Horario', icon: LucideCalendarDays },
      { path: 'calificaciones', label: 'Calificaciones', icon: LucideGraduationCap },
      { path: 'asistencia', label: 'Asistencia', icon: LucideUserRoundCheck },
      { path: 'justificantes', label: 'Solicitud de justificantes', icon: LucideFileText },
    ],
  },
  tutor: {
    role: 'tutor',
    basePath: '/tutor',
    mobileRoleTitle: 'Tutor',
    mobileMenuWidth: 312,
    desktop: [
      { title: 'General', items: [
        home(),
        { path: 'alumnos', label: 'Mis alumnos', icon: LucideUserRoundGroup },
      ] },
      { title: 'Seguimiento', items: [
        { path: 'justificantes', label: 'Justificantes', icon: LucideFileText },
        { path: 'seguimientos', label: 'Seguimientos', icon: LucideSpotlight },
        { path: 'alertas', label: 'Alertas', icon: LucideTriangleAlert },
        { path: 'estadisticas', label: 'Estadísticas', icon: LucideChartColumn },
      ] },
    ],
    mobile: [
      home(),
      { path: 'alumnos', label: 'Mis alumnos', icon: LucideUsers },
      { path: 'seguimientos', label: 'Seguimientos', icon: LucideClipboardList },
      { path: 'alertas', label: 'Alertas', icon: LucideTriangleAlert },
      { path: 'estadisticas', label: 'Estadísticas', icon: LucideChartColumn },
      { path: 'justificantes', label: 'Solicitud de justificantes', icon: LucideFileText },
    ],
  },
  director: {
    role: 'director',
    basePath: '/director',
    mobileRoleTitle: 'Dirección / Académico',
    mobileMenuWidth: 352,
    desktop: [
      { title: 'General', items: [home()] },
      { title: 'Gestión académica', items: [
        { path: 'periodos', label: 'Periodos académicos', icon: LucideCalendars },
        { path: 'grupos', label: 'Grupos', icon: LucideUserRoundGroup },
        { path: 'asignaciones-tutores', label: 'Asignaciones de tutores', icon: LucideClipboardList },
        { path: 'horarios', label: 'Horarios', icon: LucideCalendarClock },
      ] },
      { title: 'Seguimiento', items: [
        { path: 'analytics', label: 'Analytics', icon: LucideChartNoAxesCombined },
        { path: 'alertas', label: 'Alertas', icon: LucideBellRing },
      ] },
      { title: 'Administración', items: [
        { path: 'auditoria', label: 'Auditoría', icon: LucideClipboardCheck },
      ] },
    ],
    mobile: [
      home(),
      { path: 'periodos', label: 'Periodos académicos', icon: LucideCalendarRange },
      { path: 'grupos', label: 'Grupos', icon: LucideUsers },
      { path: 'horarios', label: 'Horarios', icon: LucideCalendarDays },
    ],
  },
};

/** Todas las rutas hijas de un rol (unión de escritorio y móvil), sin duplicados. */
export function navPathsFor(role: UiRole): readonly NavEntry[] {
  const nav = ROLE_NAVIGATION[role];
  const all = [...nav.desktop.flatMap((g) => g.items), ...nav.mobile];
  return all.filter((entry, i) => all.findIndex((e) => e.path === entry.path) === i);
}
