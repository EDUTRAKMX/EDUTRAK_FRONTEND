import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiError } from '../data/api-error';
import { ScheduleRepository } from '../data/schedule.repository';
import { CreateScheduleRequest, Schedule, ScheduleDetail } from '../../shared/models/academic.model';
import { MockDatabase } from './mock-database';
import { mockCall } from './simulate-latency';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const CLASSROOM_MAX = 40;

@Injectable()
export class MockScheduleRepository implements ScheduleRepository {
  private readonly db = inject(MockDatabase);

  list(filter?: { readonly group_id?: string }): Observable<readonly ScheduleDetail[]> {
    return mockCall(() => {
      const details: ScheduleDetail[] = [];
      for (const slot of this.db.schedules) {
        const a = this.db.assignments.find((x) => x.id === slot.teaching_assignment_id);
        if (!a || (filter?.group_id && a.group_id !== filter.group_id)) continue;
        details.push({
          ...slot,
          group_id: a.group_id,
          group_code: a.group_code,
          subject_code: a.subject_code,
          subject_name: a.subject_name,
          teacher_name: a.teacher_name,
        });
      }
      return details;
    });
  }

  add(assignmentId: string, request: CreateScheduleRequest): Observable<Schedule> {
    return mockCall(() => {
      const assignment = this.db.assignments.find((a) => a.id === assignmentId);
      if (!assignment) throw new ApiError(404, 'teaching_assignment_not_found', 'teaching assignment not found');
      const group = this.db.groups.find((g) => g.id === assignment.group_id);
      const term = this.db.terms.find((t) => t.id === group?.academic_term_id);
      if (term?.status === 'closed') throw new ApiError(409, 'term_closed', 'the academic term is closed');
      if (!Number.isInteger(request.day_of_week) || request.day_of_week < 1 || request.day_of_week > 7) {
        throw new ApiError(422, 'invalid_day_of_week', 'day_of_week must be between 1 (Monday) and 7 (Sunday)');
      }
      if (!TIME.test(request.start_time) || !TIME.test(request.end_time)) {
        throw new ApiError(422, 'invalid_time', 'time must use the HH:MM format');
      }
      if (request.start_time >= request.end_time) {
        throw new ApiError(422, 'invalid_time_range', 'start_time must be before end_time');
      }
      const classroom = request.classroom?.trim() || null;
      if (classroom && classroom.length > CLASSROOM_MAX) throw new ApiError(422, 'classroom_too_long', 'classroom is too long');
      // Regla del backend: sin solapamiento dentro de la MISMA asignación.
      const overlaps = this.db.schedules.some(
        (s) =>
          s.teaching_assignment_id === assignmentId &&
          s.day_of_week === request.day_of_week &&
          s.start_time < request.end_time &&
          request.start_time < s.end_time,
      );
      if (overlaps) {
        throw new ApiError(409, 'schedule_overlap', 'the schedule overlaps another one of the same teaching assignment');
      }
      const slot: Schedule = {
        id: this.db.newId(),
        teaching_assignment_id: assignmentId,
        day_of_week: request.day_of_week,
        start_time: request.start_time,
        end_time: request.end_time,
        classroom,
      };
      this.db.schedules = [...this.db.schedules, slot];
      return slot;
    });
  }
}
