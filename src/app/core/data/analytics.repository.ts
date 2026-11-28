import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Paginated } from '../../shared/models/api.model';
import {
  Alert,
  AlertRule,
  AlertStatus,
  GroupAnalytics,
  GroupOverview,
  UncontractedIndicators,
} from '../../shared/models/analytics.model';

export interface AlertFilter {
  readonly academic_term_id?: string;
  readonly group_id?: string;
  readonly rule?: AlertRule;
  /** Vacío = sin resolver (OPEN + ACKNOWLEDGED); `ALL` = todos. */
  readonly status?: AlertStatus | 'ALL';
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Analytics (`/api/analytics/overview|groups/{id}|alerts`). Solo DIRECTOR y TUTOR del grupo.
 * Los porcentajes suman numeradores y denominadores (nunca promedian porcentajes).
 */
export interface AnalyticsRepository {
  overview(filter?: { readonly academic_term_id?: string }): Observable<readonly GroupOverview[]>;
  group(groupId: string): Observable<GroupAnalytics>;
  alerts(filter?: AlertFilter): Observable<Paginated<Alert>>;
  /**
   * Indicadores que el backend NO calcula (promedio, variaciones). Solo el mock los resuelve; una
   * implementación HTTP devolverá valores `null` hasta que exista un contrato.
   */
  uncontractedIndicators(termId: string, groupId?: string): Observable<UncontractedIndicators>;
}

export const ANALYTICS_REPOSITORY = new InjectionToken<AnalyticsRepository>('ANALYTICS_REPOSITORY');
