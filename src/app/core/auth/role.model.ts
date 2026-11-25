/** Roles tal como los define el backend (api/openapi.yaml, schema Role). */
export type ApiRole = 'ADMIN' | 'DIRECTOR' | 'TEACHER' | 'TUTOR' | 'STUDENT';

/**
 * Roles con interfaz en Figma. ADMIN no tiene diseño: su interfaz está pospuesta
 * (ver docs/FRONTEND_IMPLEMENTATION_PLAN.md), sin eliminar su soporte en el contrato.
 */
export type UiRole = 'director' | 'profesor' | 'tutor' | 'alumno';

export const UI_ROLES: readonly UiRole[] = ['director', 'profesor', 'tutor', 'alumno'];

export const UI_ROLE_TO_API: Readonly<Record<UiRole, ApiRole>> = {
  director: 'DIRECTOR',
  profesor: 'TEACHER',
  tutor: 'TUTOR',
  alumno: 'STUDENT',
};

/** Etiqueta bajo el nombre en el topbar (Figma). */
export const UI_ROLE_LABEL: Readonly<Record<UiRole, string>> = {
  director: 'Director de carrera',
  profesor: 'Docente',
  tutor: 'Tutor',
  alumno: 'Alumno',
};

export function isUiRole(value: unknown): value is UiRole {
  return typeof value === 'string' && (UI_ROLES as readonly string[]).includes(value);
}
