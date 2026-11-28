import { Tone } from '../../../shared/components/badge/badge.component';
import { Term, TermStatus } from '../../../shared/models/academic.model';
import { MONTHS_SHORT, parseIsoDate, weeksOf } from '../../../shared/utils/date-utils';

/** Estados del backend con las etiquetas del diseño (`draft` = "Planeado"). */
export const TERM_STATUS_LABEL: Readonly<Record<TermStatus, string>> = {
  draft: 'Planeado',
  active: 'Activo',
  closed: 'Cerrado',
};

export const TERM_STATUS_TONE: Readonly<Record<TermStatus, Tone>> = {
  draft: 'info',
  active: 'success',
  closed: 'neutral',
};

/**
 * Nombre del periodo a partir del rango (Figma 72:886: "Ene - Abr 2027"). Si cruza de año: "Dic 2026 - Mar 2027".
 * Es el `name` que recibe `POST /api/academic/terms` (texto libre ≤ 80 en el backend).
 */
export function termNameFromRange(start: string, end: string): string {
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  if (!a || !b) return '';
  const first = MONTHS_SHORT[a.getMonth()];
  const last = MONTHS_SHORT[b.getMonth()];
  return a.getFullYear() === b.getFullYear()
    ? `${first} - ${last} ${a.getFullYear()}`
    : `${first} ${a.getFullYear()} - ${last} ${b.getFullYear()}`;
}

export function termWeeks(term: Pick<Term, 'start_date' | 'end_date'>): number {
  return weeksOf(term.start_date, term.end_date);
}

export const TERM_NAME_MAX = 80;
