import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiError } from '../data/api-error';
import { GroupFilter, GroupRepository } from '../data/group.repository';
import {
  CreateAssignmentRequest,
  CreateGroupRequest,
  Enrollment,
  Group,
  TeachingAssignment,
} from '../../shared/models/academic.model';
import { MockDatabase } from './mock-database';
import { mockCall } from './simulate-latency';

const CODE_MAX = 20;

@Injectable()
export class MockGroupRepository implements GroupRepository {
  private readonly db = inject(MockDatabase);

  list(filter?: GroupFilter): Observable<readonly Group[]> {
    return mockCall(() =>
      this.db.groups.filter((g) => !filter?.academic_term_id || g.academic_term_id === filter.academic_term_id),
    );
  }

  getById(id: string): Observable<Group> {
    return mockCall(() => this.find(id));
  }

  create(request: CreateGroupRequest): Observable<Group> {
    return mockCall(() => {
      const term = this.db.terms.find((t) => t.id === request.academic_term_id);
      if (!term) throw new ApiError(422, 'term_not_found', 'academic term not found');
      const career = this.db.careers.find((c) => c.id === request.career_id);
      if (!career) throw new ApiError(422, 'career_not_found', 'career not found');
      if (!career.is_active) throw new ApiError(409, 'career_inactive', 'the career is not active');
      if (term.status === 'closed') throw new ApiError(409, 'term_closed', 'the academic term is closed');
      const code = request.code.trim().toUpperCase();
      if (!code) throw new ApiError(422, 'group_code_required', 'code is required');
      if (code.length > CODE_MAX) throw new ApiError(422, 'group_code_too_long', 'code is too long');
      if (!Number.isInteger(request.level) || request.level < 1) {
        throw new ApiError(422, 'invalid_level', 'level must be a positive integer');
      }
      const tutorId = request.tutor_id ?? null;
      this.assertTutor(tutorId);
      if (this.db.groups.some((g) => g.academic_term_id === term.id && g.code === code)) {
        throw new ApiError(409, 'group_code_taken', 'the term already has a group with that code');
      }
      const group: Group = {
        id: this.db.newId(),
        academic_term_id: term.id,
        academic_term_name: term.name,
        career_id: career.id,
        career_code: career.code,
        career_name: career.name,
        tutor_id: tutorId,
        code,
        level: request.level,
      };
      this.db.groups = [...this.db.groups, group];
      return group;
    });
  }

  setTutor(groupId: string, tutorId: string | null): Observable<Group> {
    return mockCall(() => {
      const group = this.find(groupId);
      this.assertTermOpen(group);
      this.assertTutor(tutorId);
      const updated: Group = { ...group, tutor_id: tutorId };
      this.db.groups = this.db.groups.map((g) => (g.id === groupId ? updated : g));
      return updated;
    });
  }

  listEnrollments(groupId: string): Observable<readonly Enrollment[]> {
    return mockCall(() => {
      this.find(groupId);
      return this.db.enrollments.filter((e) => e.group_id === groupId);
    });
  }

  enroll(groupId: string, studentId: string): Observable<Enrollment> {
    return mockCall(() => {
      const group = this.find(groupId);
      this.assertTermOpen(group);
      const student = this.db.students.find((s) => s.id === studentId);
      if (!student) throw new ApiError(422, 'invalid_student', 'the user must be an active STUDENT');
      if (this.db.enrollments.some((e) => e.group_id === groupId && e.student_id === studentId && e.status === 'ACTIVE')) {
        throw new ApiError(409, 'already_enrolled', 'the student is already enrolled in this group');
      }
      const enrollment: Enrollment = {
        id: this.db.newId(),
        group_id: groupId,
        student_id: studentId,
        status: 'ACTIVE',
        enrolled_at: new Date().toISOString(),
        student,
      };
      this.db.enrollments = [...this.db.enrollments, enrollment];
      return enrollment;
    });
  }

  listAssignments(groupId: string): Observable<readonly TeachingAssignment[]> {
    return mockCall(() => {
      this.find(groupId);
      return this.db.assignments.filter((a) => a.group_id === groupId);
    });
  }

  listAllAssignments(): Observable<readonly TeachingAssignment[]> {
    return mockCall(() => [...this.db.assignments]);
  }

  createAssignment(groupId: string, request: CreateAssignmentRequest): Observable<TeachingAssignment> {
    return mockCall(() => {
      const group = this.find(groupId);
      this.assertTermOpen(group);
      const entry = this.db.curriculum.find(
        (c) => c.career_id === group.career_id && c.level === group.level && c.subject_id === request.subject_id,
      );
      if (!entry) {
        throw new ApiError(422, 'subject_not_in_curriculum', "the subject is not in the group's career curriculum at the group's level");
      }
      const teacher = this.db.teachers.find((t) => t.id === request.teacher_id);
      if (!teacher) throw new ApiError(422, 'invalid_teacher', 'the user must be an active TEACHER');
      if (this.db.assignments.some((a) => a.group_id === groupId && a.subject_id === request.subject_id)) {
        throw new ApiError(409, 'teaching_assignment_exists', 'the subject is already assigned to this group');
      }
      const assignment: TeachingAssignment = {
        id: this.db.newId(),
        group_id: groupId,
        group_code: group.code,
        subject_id: entry.subject_id,
        subject_code: entry.subject_code,
        subject_name: entry.subject_name,
        teacher_id: teacher.id,
        teacher_name: `${teacher.first_name} ${teacher.last_name}`,
      };
      this.db.assignments = [...this.db.assignments, assignment];
      return assignment;
    });
  }

  private find(id: string): Group {
    const group = this.db.groups.find((g) => g.id === id);
    if (!group) throw new ApiError(404, 'group_not_found', 'group not found');
    return group;
  }

  private assertTermOpen(group: Group): void {
    const term = this.db.terms.find((t) => t.id === group.academic_term_id);
    if (term?.status === 'closed') throw new ApiError(409, 'term_closed', 'the academic term is closed');
  }

  private assertTutor(tutorId: string | null): void {
    if (tutorId !== null && !this.db.tutors.some((t) => t.id === tutorId)) {
      throw new ApiError(422, 'invalid_tutor', 'the user must be an active TUTOR');
    }
  }
}
