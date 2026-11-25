import { UiRole, UI_ROLE_TO_API } from '../../auth/role.model';
import { User } from '../../../shared/models/user.model';

function demoUser(id: string, number: string, first: string, last: string, role: UiRole): User {
  return {
    id,
    institutional_number: number,
    email: `${number}@demo.edutrak.invalid`,
    first_name: first,
    last_name: last,
    roles: [UI_ROLE_TO_API[role]],
    must_change_password: false,
  };
}

/**
 * Personas ficticias de demostración, una por rol con interfaz.
 * El backend identifica usuarios por número institucional de 8 dígitos.
 * (Datos inventados: no corresponden a personas reales.)
 */
export const DEMO_USERS: Readonly<Record<UiRole, User>> = {
  alumno: demoUser('8a1d0000-0000-4000-8000-000000000001', '22170001', 'Alumno', 'Demo', 'alumno'),
  profesor: demoUser('8a1d0000-0000-4000-8000-000000000002', '10000002', 'Docente', 'Demo', 'profesor'),
  tutor: demoUser('8a1d0000-0000-4000-8000-000000000003', '10000003', 'Tutor', 'Demo', 'tutor'),
  director: demoUser('8a1d0000-0000-4000-8000-000000000004', '10000004', 'Director', 'Demo', 'director'),
};
