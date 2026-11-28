import { Person } from './academic.model';

/** Categorías de calificación del backend (NA < 80, SA 80–89.99, DE 90–99.99, AU = 100). El cliente no recategoriza. */
export type GradeCategory = 'NA' | 'SA' | 'DE' | 'AU';

export type AlertRule = 'GRADE_NA_UNIT' | 'UNJUSTIFIED_ABSENCES' | 'ATTENDANCE_DROP' | 'PENDING_JUSTIFICATIONS';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

/** Schema `Alert` de api/openapi.yaml. */
export interface Alert {
  readonly id: string;
  readonly rule: AlertRule;
  readonly rule_description: string;
  readonly status: AlertStatus;
  readonly message: string;
  readonly evidence: Readonly<Record<string, unknown>>;
  readonly student: Person;
  readonly group: { readonly id: string; readonly code: string };
  readonly academic_term: { readonly id: string; readonly name: string };
  readonly subject: { readonly subject_enrollment_id: string; readonly code: string; readonly name: string } | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly evaluated_at: string;
  readonly resolved_at: string | null;
}

/** Bloque `grades` de analytics (conteos por categoría; no hay promedios en el contrato). */
export interface GradesSummary {
  readonly units_total: number;
  readonly units_graded: number;
  readonly units_pending: number;
  readonly na: number;
  readonly sa: number;
  readonly de: number;
  readonly au: number;
}

/** Bloque `attendance` de analytics. `attendance_pct` ajustada por justificantes; `null` sin denominador. */
export interface AttendanceSummary {
  readonly closed_session_records: number;
  readonly present: number;
  readonly late: number;
  readonly absent: number;
  readonly justified: number;
  readonly unjustified_absences: number;
  readonly attendance_pct: number | null;
}

/** Una línea de `GET /api/analytics/overview` (un grupo). Forma tomada del handler del backend (el OpenAPI no la tipa). */
export interface GroupOverview {
  readonly group: { readonly id: string; readonly code: string; readonly level: number };
  readonly career: { readonly id: string; readonly code: string; readonly name: string };
  readonly academic_term: { readonly id: string; readonly name: string; readonly status: string };
  readonly active_students: number;
  readonly grades: GradesSummary;
  readonly attendance: AttendanceSummary;
  readonly justifications: { readonly requests_total: number; readonly pending_tutor: number; readonly pending_teacher: number };
  readonly tutoring: { readonly students_with_followup: number; readonly students_without_followup: number };
  /** Alertas sin resolver (OPEN + ACKNOWLEDGED) del grupo. */
  readonly open_alerts: number;
}

/** Fila de alumno de `GET /api/analytics/groups/{id}` (campo `students`). */
export interface GroupStudentRow {
  readonly student: Person;
  readonly attendance_pct: number | null;
  readonly unjustified_absences: number;
  readonly na_units: number;
  readonly pending_units: number;
  readonly open_alerts: number;
}

/** Línea por materia de `GET /api/analytics/groups/{id}` (campo `by_assignment`). */
export interface AssignmentAnalytics {
  readonly teaching_assignment_id: string;
  readonly subject: { readonly code: string; readonly name: string };
  readonly active_subject_enrollments: number;
  readonly grades: GradesSummary;
  readonly attendance: AttendanceSummary;
}

export interface GroupAnalytics extends GroupOverview {
  readonly by_assignment: readonly AssignmentAnalytics[];
  readonly students: readonly GroupStudentRow[];
}

/**
 * Indicadores SIN contrato en el backend, calculados solo en el mock a partir de los mismos hechos
 * (calificaciones y asistencias). Ver docs/MOCK_DATA_ARCHITECTURE.md (discrepancias).
 */
export interface UncontractedIndicators {
  /** Promedio de calificaciones capturadas (0–100). El backend no calcula promedios. */
  readonly average_score: number | null;
  /** Cambio del promedio frente a la unidad anterior, en puntos. */
  readonly average_delta: number | null;
  /** Diferencia de asistencia (pp) entre las últimas 4 semanas y las 4 anteriores. */
  readonly attendance_delta_pp: number | null;
}
