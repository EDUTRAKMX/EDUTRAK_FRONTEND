import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { APP_ENV } from '../config/app-config';
import { MOCK_ACCOUNTS } from '../mock/fixtures/users.fixture';
import { MockAuthApi } from '../mock/mock-auth.api';
import { AUTH_API, DEMO_ACCOUNT_HINTS, DemoAccountHint } from './auth.api';
import { DemoSessionPersistence, NoSessionPersistence, SESSION_PERSISTENCE } from './session-persistence';

/**
 * Registro de la autenticación según `environment.mockAuth`.
 *  - mockAuth = true  (development / demo): API simulada, pista de sesión en sessionStorage y cuentas de ayuda en el login.
 *  - mockAuth = false (production): sin persistencia ni cuentas de ayuda. La API HTTP aún no existe, así que
 *    resolverla falla con un mensaje explícito. Para conectar el backend, sustituir ese `throw` por `HttpAuthApi`.
 */
export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: AUTH_API,
      useFactory: () => {
        if (inject(APP_ENV).mockAuth) return new MockAuthApi();
        throw new Error('Autenticación HTTP aún no implementada: solo existe la autenticación simulada (mockAuth).');
      },
    },
    {
      provide: SESSION_PERSISTENCE,
      useFactory: () => (inject(APP_ENV).mockAuth ? new DemoSessionPersistence() : new NoSessionPersistence()),
    },
    {
      provide: DEMO_ACCOUNT_HINTS,
      useFactory: (): readonly DemoAccountHint[] =>
        inject(APP_ENV).mockAuth
          ? MOCK_ACCOUNTS.map((a) => ({
              label: a.label,
              institutionalNumber: a.user.institutional_number,
              password: a.password,
              note: a.user.must_change_password ? 'Exige cambiar la contraseña al entrar' : undefined,
            }))
          : [],
    },
  ]);
}
