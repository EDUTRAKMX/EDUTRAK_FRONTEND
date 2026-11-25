import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Term } from '../../shared/models/academic.model';

/**
 * Contrato de acceso a periodos académicos.
 * Las pantallas dependen únicamente de esta interfaz: la implementación mock
 * (core/mock) se sustituirá por una HTTP sin tocar la lógica visual.
 */
export interface TermRepository {
  list(): Observable<readonly Term[]>;
  /** Periodo con estado `active`, o null si no hay ninguno. */
  getActive(): Observable<Term | null>;
}

export const TERM_REPOSITORY = new InjectionToken<TermRepository>('TERM_REPOSITORY');
