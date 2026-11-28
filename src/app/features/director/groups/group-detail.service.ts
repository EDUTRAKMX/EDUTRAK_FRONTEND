import { Injectable, inject, signal } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { ANALYTICS_REPOSITORY } from '../../../core/data/analytics.repository';
import { DIRECTORY_REPOSITORY } from '../../../core/data/directory.repository';
import { GROUP_REPOSITORY } from '../../../core/data/group.repository';
import { SCHEDULE_REPOSITORY } from '../../../core/data/schedule.repository';
import { TERM_REPOSITORY } from '../../../core/data/term.repository';
import { Enrollment, Group, Person, ScheduleDetail, TeachingAssignment, Term } from '../../../shared/models/academic.model';
import { Alert, GroupAnalytics, UncontractedIndicators } from '../../../shared/models/analytics.model';

export interface GroupDetailVm {
  readonly group: Group;
  readonly term: Term;
  readonly tutor: Person | null;
  readonly analytics: GroupAnalytics;
  readonly indicators: UncontractedIndicators;
  readonly alerts: readonly Alert[];
  readonly enrollments: readonly Enrollment[];
  readonly assignments: readonly TeachingAssignment[];
  readonly schedules: readonly ScheduleDetail[];
}

/**
 * Datos del detalle de un grupo, compartidos por Resumen y Alumnos (se provee en `GroupDetailPage`).
 * Todo sale de los repositorios: la misma fuente que Grupos, Inicio y Horarios.
 */
@Injectable()
export class GroupDetailService {
  private readonly groups = inject(GROUP_REPOSITORY);
  private readonly terms = inject(TERM_REPOSITORY);
  private readonly analytics = inject(ANALYTICS_REPOSITORY);
  private readonly schedules = inject(SCHEDULE_REPOSITORY);
  private readonly directory = inject(DIRECTORY_REPOSITORY);

  readonly vm = signal<GroupDetailVm | null>(null);
  readonly loading = signal(true);
  readonly error = signal<'not-found' | 'failed' | null>(null);

  private groupId = '';
  private sub: Subscription | null = null;

  load(groupId: string): void {
    this.groupId = groupId;
    this.reload();
  }

  reload(): void {
    this.sub?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.sub = this.groups.getById(this.groupId).subscribe({
      next: (group) => {
        this.sub = forkJoin({
          terms: this.terms.list(),
          analytics: this.analytics.group(group.id),
          indicators: this.analytics.uncontractedIndicators(group.academic_term_id, group.id),
          alerts: this.analytics.alerts({ group_id: group.id, limit: 200 }),
          enrollments: this.groups.listEnrollments(group.id),
          assignments: this.groups.listAssignments(group.id),
          schedules: this.schedules.list({ group_id: group.id }),
          tutors: this.directory.tutors(),
        }).subscribe({
          next: (r) => {
            const term = r.terms.find((t) => t.id === group.academic_term_id);
            if (!term) {
              this.fail('failed');
              return;
            }
            this.vm.set({
              group,
              term,
              tutor: r.tutors.find((t) => t.id === group.tutor_id) ?? null,
              analytics: r.analytics,
              indicators: r.indicators,
              alerts: r.alerts.data,
              enrollments: r.enrollments,
              assignments: r.assignments,
              schedules: r.schedules,
            });
            this.loading.set(false);
          },
          error: () => this.fail('failed'),
        });
      },
      error: (e: { status?: number }) => this.fail(e?.status === 404 ? 'not-found' : 'failed'),
    });
  }

  destroy(): void {
    this.sub?.unsubscribe();
  }

  private fail(kind: 'not-found' | 'failed'): void {
    this.loading.set(false);
    this.error.set(kind);
  }
}
