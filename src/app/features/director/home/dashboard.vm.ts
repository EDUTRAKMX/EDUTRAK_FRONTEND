import { Group, Person, Term } from '../../../shared/models/academic.model';
import { Alert, AlertRule, GroupOverview, UncontractedIndicators } from '../../../shared/models/analytics.model';
import { attendancePct } from '../../../shared/utils/attendance';

export interface DashboardAlertRow {
  readonly rule: AlertRule;
  /** Alumnos distintos con una alerta sin resolver de esta regla. */
  readonly students: number;
}

export interface DashboardGroupRow {
  readonly id: string;
  readonly code: string;
  readonly level: number;
  readonly tutorName: string | null;
  readonly students: number;
  readonly attendancePct: number | null;
  readonly alerts: number;
}

/** Datos de la pantalla Inicio del Director, TODOS derivados de los repositorios (nada se escribe a mano). */
export interface DashboardVm {
  readonly term: Term | null;
  readonly groupsActive: number;
  /** Diferencia de grupos frente al periodo anterior (null si no hay periodo anterior). */
  readonly groupsDelta: number | null;
  readonly students: number;
  readonly studentsWithAlerts: number;
  readonly openAlerts: number;
  /** Alertas OPEN (aún no reconocidas). */
  readonly needReview: number;
  readonly attendancePct: number | null;
  readonly attendanceDeltaPp: number | null;
  readonly averageScore: number | null;
  readonly averageDelta: number | null;
  readonly alertRows: readonly DashboardAlertRow[];
  readonly groups: readonly DashboardGroupRow[];
}

export interface DashboardSource {
  readonly term: Term | null;
  readonly terms: readonly Term[];
  readonly groups: readonly Group[];
  readonly overview: readonly GroupOverview[];
  /** Alertas sin resolver del periodo. */
  readonly alerts: readonly Alert[];
  readonly tutors: readonly Person[];
  readonly indicators: UncontractedIndicators | null;
}

/** Las tres reglas que el diseño muestra (PENDING_JUSTIFICATIONS no aparece en Figma). */
export const DASHBOARD_RULES: readonly AlertRule[] = ['ATTENDANCE_DROP', 'UNJUSTIFIED_ABSENCES', 'GRADE_NA_UNIT'];

export function buildDashboard(src: DashboardSource): DashboardVm {
  const { term, overview, alerts } = src;
  const previous = term
    ? [...src.terms].filter((t) => t.end_date < term.start_date).sort((a, b) => b.end_date.localeCompare(a.end_date))[0]
    : undefined;
  const previousGroups = previous ? src.groups.filter((g) => g.academic_term_id === previous.id).length : null;

  let present = 0;
  let late = 0;
  let absent = 0;
  for (const row of overview) {
    present += row.attendance.present;
    late += row.attendance.late;
    absent += row.attendance.absent;
  }

  const tutorName = (id: string | null): string | null => {
    const tutor = id ? src.tutors.find((t) => t.id === id) : undefined;
    return tutor ? `${tutor.first_name} ${tutor.last_name}` : null;
  };
  const groupById = new Map(src.groups.map((g) => [g.id, g]));

  return {
    term,
    groupsActive: overview.length,
    groupsDelta: previousGroups === null ? null : overview.length - previousGroups,
    students: overview.reduce((n, r) => n + r.active_students, 0),
    studentsWithAlerts: new Set(alerts.map((a) => a.student.id)).size,
    openAlerts: alerts.length,
    needReview: alerts.filter((a) => a.status === 'OPEN').length,
    attendancePct: attendancePct(present, late, absent),
    attendanceDeltaPp: src.indicators?.attendance_delta_pp ?? null,
    averageScore: src.indicators?.average_score ?? null,
    averageDelta: src.indicators?.average_delta ?? null,
    alertRows: DASHBOARD_RULES.map((rule) => ({
      rule,
      students: new Set(alerts.filter((a) => a.rule === rule).map((a) => a.student.id)).size,
    })),
    groups: overview
      .map((row) => ({
        id: row.group.id,
        code: row.group.code,
        level: row.group.level,
        tutorName: tutorName(groupById.get(row.group.id)?.tutor_id ?? null),
        students: row.active_students,
        attendancePct: row.attendance.attendance_pct,
        alerts: row.open_alerts,
      }))
      .sort((a, b) => a.level - b.level || a.code.localeCompare(b.code)),
  };
}
