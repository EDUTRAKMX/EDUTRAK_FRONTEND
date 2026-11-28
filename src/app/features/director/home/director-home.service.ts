import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ANALYTICS_REPOSITORY } from '../../../core/data/analytics.repository';
import { DIRECTORY_REPOSITORY } from '../../../core/data/directory.repository';
import { GROUP_REPOSITORY } from '../../../core/data/group.repository';
import { TERM_REPOSITORY } from '../../../core/data/term.repository';
import { DashboardVm, buildDashboard } from './dashboard.vm';

/** Reúne las consultas del Inicio del Director a través de los repositorios (sin conocer el mock). */
@Injectable()
export class DirectorHomeService {
  private readonly terms = inject(TERM_REPOSITORY);
  private readonly groups = inject(GROUP_REPOSITORY);
  private readonly analytics = inject(ANALYTICS_REPOSITORY);
  private readonly directory = inject(DIRECTORY_REPOSITORY);

  load(): Observable<DashboardVm> {
    return this.terms.list().pipe(
      switchMap((terms) => {
        const term = terms.find((t) => t.status === 'active') ?? null;
        if (!term) {
          return of(buildDashboard({ term, terms, groups: [], overview: [], alerts: [], tutors: [], indicators: null }));
        }
        return forkJoin({
          groups: this.groups.list(),
          overview: this.analytics.overview({ academic_term_id: term.id }),
          // El backend pagina las alertas (máx. 200 por página): ver discrepancias en la documentación.
          alerts: this.analytics.alerts({ academic_term_id: term.id, limit: 200 }),
          tutors: this.directory.tutors(),
          indicators: this.analytics.uncontractedIndicators(term.id),
        }).pipe(
          map(({ groups, overview, alerts, tutors, indicators }) =>
            buildDashboard({ term, terms, groups, overview, alerts: alerts.data, tutors, indicators }),
          ),
        );
      }),
    );
  }
}
