import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Career, CurriculumEntry, Subject } from '../../shared/models/academic.model';

/** Catálogo institucional (`/api/academic/careers|subjects`, `/careers/{id}/curriculum`). Lectura. */
export interface CatalogRepository {
  careers(): Observable<readonly Career[]>;
  subjects(): Observable<readonly Subject[]>;
  /** Materias de la carrera; `level` filtra por cuatrimestre. */
  curriculum(careerId: string, level?: number): Observable<readonly CurriculumEntry[]>;
}

export const CATALOG_REPOSITORY = new InjectionToken<CatalogRepository>('CATALOG_REPOSITORY');
