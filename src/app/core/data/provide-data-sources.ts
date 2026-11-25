import { EnvironmentProviders, Provider, inject, makeEnvironmentProviders } from '@angular/core';
import { APP_ENV } from '../config/app-config';
import { MockTermRepository } from '../mock/mock-term.repository';
import { TERM_REPOSITORY } from './term.repository';

/**
 * Registra los repositorios según `environment.dataSource`.
 * Para conectar el backend: añadir aquí las implementaciones HTTP y quitar el `throw`.
 * Las pantallas nunca importan una implementación concreta, solo los tokens.
 */
export function provideDataSources(): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: TERM_REPOSITORY,
      useFactory: () => {
        const env = inject(APP_ENV);
        if (env.dataSource === 'mock') {
          return new MockTermRepository();
        }
        throw new Error('Repositorios HTTP aún no implementados (Fase 1: solo datos mock).');
      },
    },
  ];
  return makeEnvironmentProviders(providers);
}
