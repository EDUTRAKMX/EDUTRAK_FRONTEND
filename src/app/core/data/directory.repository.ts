import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Person } from '../../shared/models/academic.model';

/**
 * Directorio de personas por rol, necesario para los selectores de tutor, profesor y alumno.
 *
 * DISCREPANCIA CON EL BACKEND: el contrato NO ofrece ningún endpoint de listado de usuarios
 * (solo `POST /api/admin/users`). Este repositorio existe únicamente en el mock; la integración real
 * requerirá un endpoint (p. ej. listado de usuarios por rol para DIRECTOR). Ver docs/MOCK_DATA_ARCHITECTURE.md.
 */
export interface DirectoryRepository {
  teachers(): Observable<readonly Person[]>;
  tutors(): Observable<readonly Person[]>;
  students(): Observable<readonly Person[]>;
}

export const DIRECTORY_REPOSITORY = new InjectionToken<DirectoryRepository>('DIRECTORY_REPOSITORY');
