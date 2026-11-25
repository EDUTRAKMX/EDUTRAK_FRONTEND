import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TermRepository } from '../data/term.repository';
import { Term } from '../../shared/models/academic.model';
import { TERMS_FIXTURE } from './fixtures/terms.fixture';
import { mockResponse } from './simulate-latency';

@Injectable()
export class MockTermRepository implements TermRepository {
  list(): Observable<readonly Term[]> {
    return mockResponse(TERMS_FIXTURE);
  }

  getActive(): Observable<Term | null> {
    return this.list().pipe(map((terms) => terms.find((t) => t.status === 'active') ?? null));
  }
}
