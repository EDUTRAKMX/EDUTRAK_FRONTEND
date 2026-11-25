import { UiRole, UI_ROLE_TO_API } from '../../auth/role.model';
import { User } from '../../../shared/models/user.model';

export interface MockAccount {
  readonly user: User;
  /** Contraseña FICTICIA de demostración (solo existe en el entorno mock). */
  readonly password: string;
  readonly label: string;
}

function account(
  id: number,
  number: string,
  first: string,
  last: string,
  role: UiRole,
  password: string,
  label: string,
  mustChange = false,
): MockAccount {
  return {
    label,
    password,
    user: {
      id: `8a1d0000-0000-4000-8000-${String(id).padStart(12, '0')}`,
      institutional_number: number,
      email: `${number}@demo.edutrak.invalid`,
      first_name: first,
      last_name: last,
      roles: [UI_ROLE_TO_API[role]],
      must_change_password: mustChange,
    },
  };
}

/**
 * Cuentas ficticias de demostración (datos inventados; ninguna corresponde a una persona real).
 * El backend identifica usuarios por número institucional de 8 dígitos y contraseñas de ≥ 10 caracteres.
 * El rol lo determina la respuesta del servicio de autenticación, nunca la UI.
 */
export const MOCK_ACCOUNTS: readonly MockAccount[] = [
  account(1, '22170001', 'Alumno', 'Demo', 'alumno', 'demo-alumno-2026', 'Alumno'),
  account(2, '10000002', 'Docente', 'Demo', 'profesor', 'demo-docente-2026', 'Profesor'),
  account(3, '10000003', 'Tutor', 'Demo', 'tutor', 'demo-tutor-2026', 'Tutor'),
  account(4, '10000004', 'Director', 'Demo', 'director', 'demo-director-2026', 'Director'),
  account(5, '22170099', 'Alumno', 'Nuevo Demo', 'alumno', 'demo-temporal-2026', 'Alumno (cambio obligatorio)', true),
];
