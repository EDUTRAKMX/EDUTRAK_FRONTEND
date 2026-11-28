import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlertFilter, AnalyticsRepository } from '../data/analytics.repository';
import { ApiError } from '../data/api-error';
import { Group } from '../../shared/models/academic.model';
import { Paginated } from '../../shared/models/api.model';
import {
  Alert,
  AssignmentAnalytics,
  GroupAnalytics,
  GroupOverview,
  GroupStudentRow,
  UncontractedIndicators,
} from '../../shared/models/analytics.model';
import { attendancePct } from '../../shared/utils/attendance';
import { attendanceDeltaPp, attendanceSummary, averageScores, gradesSummary } from './analytics-calc';
import { SubjectEnrollmentFact } from './fixtures/academic.seed';
import { MockDatabase } from './mock-database';
import { mockCall } from './simulate-latency';

const UNRESOLVED = new Set(['OPEN', 'ACKNOWLEDGED']);

/**
 * Analytics simulado: calcula SIEMPRE a partir de los hechos de MockDatabase (calificaciones y asistencias),
 * nunca con valores sueltos, para que Inicio, Grupos y Detalle coincidan entre sí.
 */
@Injectable()
export class MockAnalyticsRepository implements AnalyticsRepository {
  private readonly db = inject(MockDatabase);

  overview(filter?: { readonly academic_term_id?: string }): Observable<readonly GroupOverview[]> {
    return mockCall(() =>
      this.db.groups
        .filter((g) => !filter?.academic_term_id || g.academic_term_id === filter.academic_term_id)
        .map((g) => this.overviewOf(g)),
    );
  }

  group(groupId: string): Observable<GroupAnalytics> {
    return mockCall(() => {
      const group = this.db.groups.find((g) => g.id === groupId);
      if (!group) throw new ApiError(404, 'group_not_found', 'group not found');
      const facts = this.factsOf(groupId);
      const activeIds = new Set(
        this.db.enrollments.filter((e) => e.group_id === groupId && e.status === 'ACTIVE').map((e) => e.student_id),
      );
      const by_assignment: AssignmentAnalytics[] = this.db.assignments
        .filter((a) => a.group_id === groupId)
        .map((a) => {
          const own = facts.filter((f) => f.teaching_assignment_id === a.id);
          return {
            teaching_assignment_id: a.id,
            subject: { code: a.subject_code, name: a.subject_name },
            active_subject_enrollments: own.length,
            grades: gradesSummary(own),
            attendance: attendanceSummary(own),
          };
        });
      const students: GroupStudentRow[] = this.db.enrollments
        .filter((e) => e.group_id === groupId && activeIds.has(e.student_id))
        .map((e) => {
          const own = facts.filter((f) => f.student_id === e.student_id);
          const grades = gradesSummary(own);
          const att = attendanceSummary(own);
          return {
            student: e.student,
            attendance_pct: att.attendance_pct,
            unjustified_absences: att.unjustified_absences,
            na_units: grades.na,
            pending_units: grades.units_pending,
            open_alerts: this.db.alerts.filter(
              (a) => a.group.id === groupId && a.student.id === e.student_id && UNRESOLVED.has(a.status),
            ).length,
          };
        });
      return { ...this.overviewOf(group), by_assignment, students };
    });
  }

  alerts(filter?: AlertFilter): Observable<Paginated<Alert>> {
    return mockCall(() => {
      const status = filter?.status ?? '';
      const matching = this.db.alerts.filter(
        (a) =>
          (!filter?.academic_term_id || a.academic_term.id === filter.academic_term_id) &&
          (!filter?.group_id || a.group.id === filter.group_id) &&
          (!filter?.rule || a.rule === filter.rule) &&
          (status === 'ALL' || (status === '' ? UNRESOLVED.has(a.status) : a.status === status)),
      );
      const limit = filter?.limit ?? 50;
      const offset = filter?.offset ?? 0;
      return { data: matching.slice(offset, offset + limit), total: matching.length, limit, offset };
    });
  }

  uncontractedIndicators(termId: string, groupId?: string): Observable<UncontractedIndicators> {
    return mockCall(() => {
      const ids = new Set(
        this.db.groups.filter((g) => g.academic_term_id === termId && (!groupId || g.id === groupId)).map((g) => g.id),
      );
      const facts = this.db.facts.filter((f) => ids.has(f.group_id));
      const { average, delta } = averageScores(facts);
      return { average_score: average, average_delta: delta, attendance_delta_pp: attendanceDeltaPp(facts) };
    });
  }

  private factsOf(groupId: string): readonly SubjectEnrollmentFact[] {
    const withdrawn = new Set(
      this.db.enrollments.filter((e) => e.group_id === groupId && e.status === 'WITHDRAWN').map((e) => e.student_id),
    );
    return this.db.facts.filter((f) => f.group_id === groupId && !withdrawn.has(f.student_id));
  }

  private overviewOf(group: Group): GroupOverview {
    const term = this.db.terms.find((t) => t.id === group.academic_term_id);
    const facts = this.factsOf(group.id);
    const active = this.db.enrollments.filter((e) => e.group_id === group.id && e.status === 'ACTIVE').length;
    const att = attendanceSummary(facts);
    return {
      group: { id: group.id, code: group.code, level: group.level },
      career: { id: group.career_id, code: group.career_code, name: group.career_name },
      academic_term: { id: group.academic_term_id, name: group.academic_term_name, status: term?.status ?? 'closed' },
      active_students: active,
      grades: gradesSummary(facts),
      attendance: { ...att, attendance_pct: attendancePct(att.present, att.late, att.absent) },
      justifications: { requests_total: 0, pending_tutor: 0, pending_teacher: 0 },
      tutoring: { students_with_followup: 0, students_without_followup: active },
      open_alerts: this.db.alerts.filter((a) => a.group.id === group.id && UNRESOLVED.has(a.status)).length,
    };
  }
}
