import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogRepository } from '../data/catalog.repository';
import { DirectoryRepository } from '../data/directory.repository';
import { Career, CurriculumEntry, Person, Subject } from '../../shared/models/academic.model';
import { MockDatabase } from './mock-database';
import { mockCall } from './simulate-latency';

@Injectable()
export class MockCatalogRepository implements CatalogRepository {
  private readonly db = inject(MockDatabase);

  careers(): Observable<readonly Career[]> {
    return mockCall(() => this.db.careers);
  }

  subjects(): Observable<readonly Subject[]> {
    return mockCall(() => this.db.subjects);
  }

  curriculum(careerId: string, level?: number): Observable<readonly CurriculumEntry[]> {
    return mockCall(() =>
      this.db.curriculum.filter((c) => c.career_id === careerId && (level === undefined || c.level === level)),
    );
  }
}

/** Solo mock: el backend no ofrece listado de usuarios (ver `DirectoryRepository`). */
@Injectable()
export class MockDirectoryRepository implements DirectoryRepository {
  private readonly db = inject(MockDatabase);

  teachers(): Observable<readonly Person[]> {
    return mockCall(() => this.db.teachers);
  }

  tutors(): Observable<readonly Person[]> {
    return mockCall(() => this.db.tutors);
  }

  students(): Observable<readonly Person[]> {
    return mockCall(() => this.db.students);
  }
}
