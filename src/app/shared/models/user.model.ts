import { ApiRole } from '../../core/auth/role.model';

/** Schema `User` de api/openapi.yaml. Los nombres de campo se conservan (snake_case) para no mapear. */
export interface User {
  readonly id: string;
  readonly institutional_number: string;
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly roles: readonly ApiRole[];
  readonly must_change_password: boolean;
}
