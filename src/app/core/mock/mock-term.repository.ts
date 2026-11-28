import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiError } from '../data/api-error';
import { TermRepository } from '../data/term.repository';
import { CreateTermRequest, Term } from '../../shared/models/academic.model';
import { MockDatabase } from './mock-database';
import { mockCall } from './simulate-latency';

const NAME_MAX = 80;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class MockTermRepository implements TermRepository {
  private readonly db = inject(MockDatabase);

  list(): Observable<readonly Term[]> {
    return mockCall(() => [...this.db.terms]);
  }

  getActive(): Observable<Term | null> {
    return this.list().pipe(map((terms) => terms.find((t) => t.status === 'active') ?? null));
  }

  getById(id: string): Observable<Term> {
    return mockCall(() => this.find(id));
  }

  create(request: CreateTermRequest): Observable<Term> {
    return mockCall(() => {
      const name = request.name.trim();
      if (!name) throw new ApiError(422, 'term_name_required', 'name is required');
      if (name.length > NAME_MAX) throw new ApiError(422, 'term_name_too_long', 'name is too long');
      if (!ISO_DATE.test(request.start_date) || !ISO_DATE.test(request.end_date) || request.start_date >= request.end_date) {
        throw new ApiError(422, 'invalid_dates', 'start_date must be before end_date');
      }
      if (this.db.terms.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
        throw new ApiError(409, 'term_name_taken', 'an academic term with that name already exists');
      }
      const term: Term = { id: this.db.newId(), name, start_date: request.start_date, end_date: request.end_date, status: 'draft' };
      this.db.terms = [...this.db.terms, term];
      return term;
    });
  }

  activate(id: string): Observable<Term> {
    return mockCall(() => this.transition(id, 'draft', 'active'));
  }

  close(id: string): Observable<Term> {
    return mockCall(() => this.transition(id, 'active', 'closed'));
  }

  private find(id: string): Term {
    const term = this.db.terms.find((t) => t.id === id);
    if (!term) throw new ApiError(404, 'term_not_found', 'academic term not found');
    return term;
  }

  /** Solo draft → active y active → closed (final). Otro cambio: 409 `invalid_term_transition`. */
  private transition(id: string, from: Term['status'], to: Term['status']): Term {
    const term = this.find(id);
    if (term.status !== from) {
      throw new ApiError(409, 'invalid_term_transition', 'the term cannot move to that status from its current one');
    }
    const updated: Term = { ...term, status: to };
    this.db.terms = this.db.terms.map((t) => (t.id === id ? updated : t));
    // Los grupos conservan el nombre del periodo (no cambia al activar/cerrar).
    return updated;
  }
}
