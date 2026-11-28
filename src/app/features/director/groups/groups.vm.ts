import { Group, Person, Term } from '../../../shared/models/academic.model';
import { GroupOverview } from '../../../shared/models/analytics.model';

/** Tarjeta de grupo de la lista (Figma 72:3849 / 183:6738): todo derivado de los repositorios. */
export interface GroupCardVm {
  readonly id: string;
  readonly code: string;
  readonly level: number;
  /** Letras de sección del código ("5A" → "A"); vacío si el código no sigue ese patrón. */
  readonly section: string;
  readonly termId: string;
  readonly termName: string;
  readonly termStatus: Term['status'];
  readonly tutorId: string | null;
  readonly tutorName: string | null;
  readonly students: number;
  readonly alerts: number;
}

export function sectionOf(code: string): string {
  return /^\d+([A-Za-z]+)/.exec(code)?.[1]?.toUpperCase() ?? '';
}

export function fullName(person: Pick<Person, 'first_name' | 'last_name'>): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

export function buildGroupCards(
  groups: readonly Group[],
  overview: readonly GroupOverview[],
  tutors: readonly Person[],
  terms: readonly Term[],
): GroupCardVm[] {
  const byGroup = new Map(overview.map((o) => [o.group.id, o]));
  const tutorById = new Map(tutors.map((t) => [t.id, t]));
  const termById = new Map(terms.map((t) => [t.id, t]));
  return groups
    .map((g) => {
      const o = byGroup.get(g.id);
      const tutor = g.tutor_id ? tutorById.get(g.tutor_id) : undefined;
      return {
        id: g.id,
        code: g.code,
        level: g.level,
        section: sectionOf(g.code),
        termId: g.academic_term_id,
        termName: g.academic_term_name,
        termStatus: termById.get(g.academic_term_id)?.status ?? 'closed',
        tutorId: g.tutor_id,
        tutorName: tutor ? fullName(tutor) : null,
        students: o?.active_students ?? 0,
        alerts: o?.open_alerts ?? 0,
      } satisfies GroupCardVm;
    })
    .sort((a, b) => a.level - b.level || a.code.localeCompare(b.code));
}

/** Búsqueda por código de grupo o nombre del tutor. */
export function matchesGroupQuery(card: GroupCardVm, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || card.code.toLowerCase().includes(q) || (card.tutorName ?? '').toLowerCase().includes(q);
}
