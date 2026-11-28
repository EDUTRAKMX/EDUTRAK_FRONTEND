import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateTermRequest, Term } from '../../shared/models/academic.model';

/**
 * Contrato de acceso a periodos académicos (`/api/academic/terms`).
 * Las pantallas dependen únicamente de esta interfaz: la implementación mock
 * (core/mock) se sustituirá por una HTTP sin tocar la lógica visual.
 *
 * Reglas del backend: el periodo nace `draft`; `activate` (draft → active) y `close` (active → closed, final)
 * son las únicas transiciones; un periodo no se edita ni se elimina. Errores: 409 `term_name_taken`,
 * 409 `invalid_term_transition`, 422 `invalid_dates`.
 */
export interface TermRepository {
  list(): Observable<readonly Term[]>;
  /** Periodo con estado `active`, o null si no hay ninguno. */
  getActive(): Observable<Term | null>;
  getById(id: string): Observable<Term>;
  create(request: CreateTermRequest): Observable<Term>;
  activate(id: string): Observable<Term>;
  close(id: string): Observable<Term>;
}

export const TERM_REPOSITORY = new InjectionToken<TermRepository>('TERM_REPOSITORY');
