import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateScheduleRequest, Schedule, ScheduleDetail } from '../../shared/models/academic.model';

/**
 * Horarios (`GET /api/academic/schedules`, `POST /api/academic/teaching-assignments/{id}/schedules`).
 * El backend solo permite CONSULTAR y AÑADIR franjas: no hay edición ni borrado. Reglas: `day_of_week` 1–7,
 * `HH:MM`, inicio < fin y sin solapamiento dentro de la misma asignación (409 `schedule_overlap`).
 */
export interface ScheduleRepository {
  /** DIRECTOR ve todas las franjas; `group_id` filtra. */
  list(filter?: { readonly group_id?: string }): Observable<readonly ScheduleDetail[]>;
  add(assignmentId: string, request: CreateScheduleRequest): Observable<Schedule>;
}

export const SCHEDULE_REPOSITORY = new InjectionToken<ScheduleRepository>('SCHEDULE_REPOSITORY');
