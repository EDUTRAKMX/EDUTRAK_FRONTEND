export type TermStatus = 'draft' | 'active' | 'closed';

/** Schema `Term` de api/openapi.yaml. Fechas `YYYY-MM-DD`. */
export interface Term {
  readonly id: string;
  readonly name: string;
  readonly start_date: string;
  readonly end_date: string;
  readonly status: TermStatus;
}

/** Schema `Group` de api/openapi.yaml. */
export interface Group {
  readonly id: string;
  readonly academic_term_id: string;
  readonly academic_term_name: string;
  readonly career_id: string;
  readonly career_code: string;
  readonly career_name: string;
  readonly tutor_id: string | null;
  readonly code: string;
  readonly level: number;
}

/** Schema `Career`. */
export interface Career {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly is_active: boolean;
}

/** Schema `Subject`. */
export interface Subject {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly is_active: boolean;
}

/** Schema `CurriculumEntry`: materia de una carrera en un cuatrimestre (`level`). */
export interface CurriculumEntry {
  readonly career_id: string;
  readonly subject_id: string;
  readonly level: number;
  readonly subject_code: string;
  readonly subject_name: string;
}

/** Schema `Person`. */
export interface Person {
  readonly id: string;
  readonly institutional_number: string;
  readonly first_name: string;
  readonly last_name: string;
}

export type EnrollmentStatus = 'ACTIVE' | 'WITHDRAWN';

/** Schema `Enrollment` (alumno inscrito en un grupo). */
export interface Enrollment {
  readonly id: string;
  readonly group_id: string;
  readonly student_id: string;
  readonly status: EnrollmentStatus;
  /** RFC 3339 UTC. */
  readonly enrolled_at: string;
  readonly student: Person;
}

/** Schema `TeachingAssignment` (materia de un grupo impartida por un profesor). */
export interface TeachingAssignment {
  readonly id: string;
  readonly group_id: string;
  readonly group_code: string;
  readonly subject_id: string;
  readonly subject_code: string;
  readonly subject_name: string;
  readonly teacher_id: string;
  readonly teacher_name: string;
}

/** Schema `Schedule`. `day_of_week` 1 (lunes) a 7; horas `HH:MM`. */
export interface Schedule {
  readonly id: string;
  readonly teaching_assignment_id: string;
  readonly day_of_week: number;
  readonly start_time: string;
  readonly end_time: string;
  readonly classroom: string | null;
}

/** Schema `ScheduleDetail`. */
export interface ScheduleDetail extends Schedule {
  readonly group_id: string;
  readonly group_code: string;
  readonly subject_code: string;
  readonly subject_name: string;
  readonly teacher_name: string;
}

/** Cuerpo de `POST /api/academic/terms`. */
export interface CreateTermRequest {
  readonly name: string;
  readonly start_date: string;
  readonly end_date: string;
}

/** Cuerpo de `POST /api/academic/groups`. */
export interface CreateGroupRequest {
  readonly academic_term_id: string;
  readonly career_id: string;
  readonly code: string;
  readonly level: number;
  readonly tutor_id?: string | null;
}

/** Cuerpo de `POST /api/academic/teaching-assignments/{id}/schedules`. */
export interface CreateScheduleRequest {
  readonly day_of_week: number;
  readonly start_time: string;
  readonly end_time: string;
  readonly classroom?: string;
}

/** Cuerpo de `POST /api/academic/groups/{id}/teaching-assignments`. */
export interface CreateAssignmentRequest {
  readonly subject_id: string;
  readonly teacher_id: string;
}
