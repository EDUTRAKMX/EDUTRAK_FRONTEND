import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateAssignmentRequest,
  CreateGroupRequest,
  Enrollment,
  Group,
  TeachingAssignment,
} from '../../shared/models/academic.model';

export interface GroupFilter {
  readonly academic_term_id?: string;
}

/**
 * Grupos, inscripciones y asignaciones docentes (`/api/academic/groups…`). Visibilidad DIRECTOR: todo.
 * Errores: 409 `group_code_taken` | `term_closed` | `career_inactive` | `already_enrolled` | `teaching_assignment_exists`,
 * 422 `invalid_tutor` | `invalid_level` | `invalid_student` | `invalid_teacher` | `subject_not_in_curriculum`.
 */
export interface GroupRepository {
  list(filter?: GroupFilter): Observable<readonly Group[]>;
  getById(id: string): Observable<Group>;
  /** `tutor_id` opcional (el backend lo permite). El código se guarda en mayúsculas. */
  create(request: CreateGroupRequest): Observable<Group>;
  /** PUT /groups/{id}/tutor. `null` quita el tutor. */
  setTutor(groupId: string, tutorId: string | null): Observable<Group>;
  listEnrollments(groupId: string): Observable<readonly Enrollment[]>;
  enroll(groupId: string, studentId: string): Observable<Enrollment>;
  listAssignments(groupId: string): Observable<readonly TeachingAssignment[]>;
  /** GET /api/academic/teaching-assignments: todas las asignaciones visibles (DIRECTOR: todas). */
  listAllAssignments(): Observable<readonly TeachingAssignment[]>;
  createAssignment(groupId: string, request: CreateAssignmentRequest): Observable<TeachingAssignment>;
}

export const GROUP_REPOSITORY = new InjectionToken<GroupRepository>('GROUP_REPOSITORY');
