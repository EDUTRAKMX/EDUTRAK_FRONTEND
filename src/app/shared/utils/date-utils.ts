/*
 * Utilidades de fechas `YYYY-MM-DD` (día calendario, sin zona horaria). El backend devuelve y recibe fechas de
 * día completo; se construyen con año/mes/día locales para evitar desfases por UTC.
 */

export const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as const;
export const MONTHS_LONG = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;
export const WEEKDAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: string): Date | null {
  const m = ISO.exec(value);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return date.getMonth() === Number(m[2]) - 1 ? date : null;
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** "01 Sep 2026". */
export function formatShortDate(value: string): string {
  const d = parseIsoDate(value);
  return d ? `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}` : value;
}

/** "11 Enero 2027". */
export function formatLongDate(value: string): string {
  const d = parseIsoDate(value);
  return d ? `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}` : value;
}

export function weekdayName(value: string): string {
  const d = parseIsoDate(value);
  return d ? WEEKDAYS_LONG[d.getDay()] : '';
}

/** Días naturales entre dos fechas, ambas incluidas. */
export function inclusiveDays(start: string, end: string): number {
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

/** Semanas redondeadas ("16 semanas"). */
export function weeksOf(start: string, end: string): number {
  return Math.round(inclusiveDays(start, end) / 7);
}
