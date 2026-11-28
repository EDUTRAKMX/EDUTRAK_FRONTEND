import { Injectable } from '@angular/core';
import {
  Career,
  CurriculumEntry,
  Enrollment,
  Group,
  Person,
  Schedule,
  Subject,
  TeachingAssignment,
  Term,
} from '../../shared/models/academic.model';
import { Alert } from '../../shared/models/analytics.model';
import { SubjectEnrollmentFact, buildSeed } from './fixtures/academic.seed';

/**
 * Base de datos en memoria del entorno mock: UNA sola fuente para todos los repositorios y, más adelante,
 * para los módulos Profesor, Tutor y Alumno. Las mutaciones simuladas (crear periodo, grupo, asignar tutor,
 * añadir franja…) viven aquí, de modo que se reflejan en todas las pantallas durante la sesión de demostración.
 * Recargar la página reinicia los datos. Solo la usan los repositorios mock, nunca los componentes.
 */
@Injectable({ providedIn: 'root' })
export class MockDatabase {
  private readonly seed = buildSeed();

  readonly careers: readonly Career[] = this.seed.careers;
  readonly subjects: readonly Subject[] = this.seed.subjects;
  readonly curriculum: readonly CurriculumEntry[] = this.seed.curriculum;
  readonly teachers: readonly Person[] = this.seed.teachers;
  readonly tutors: readonly Person[] = this.seed.tutors;
  readonly students: readonly Person[] = this.seed.students;
  readonly facts: readonly SubjectEnrollmentFact[] = this.seed.facts;

  terms: Term[] = [...this.seed.terms];
  groups: Group[] = [...this.seed.groups];
  enrollments: Enrollment[] = [...this.seed.enrollments];
  assignments: TeachingAssignment[] = [...this.seed.assignments];
  schedules: Schedule[] = [...this.seed.schedules];
  alerts: Alert[] = [...this.seed.alerts];

  newId(): string {
    return crypto.randomUUID();
  }
}
