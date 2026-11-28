import { EnvironmentProviders, Injector, Provider, inject, makeEnvironmentProviders } from '@angular/core';
import { APP_ENV } from '../config/app-config';
import { ANALYTICS_REPOSITORY } from './analytics.repository';
import { CATALOG_REPOSITORY } from './catalog.repository';
import { DIRECTORY_REPOSITORY } from './directory.repository';
import { GROUP_REPOSITORY } from './group.repository';
import { lazyRepository } from './lazy-repository';
import { SCHEDULE_REPOSITORY } from './schedule.repository';
import { TERM_REPOSITORY } from './term.repository';

/**
 * Crea la implementación mock (importada de forma diferida) si `dataSource` es `mock`; si no, falla con un mensaje
 * explícito. Los datos mock y la semilla quedan en un chunk aparte, fuera del bundle inicial.
 */
function mock<T extends object>(load: () => Promise<new () => T>): () => T {
  return () => {
    const injector = inject(Injector);
    if (inject(APP_ENV).dataSource === 'mock') return lazyRepository(injector, load);
    throw new Error('Repositorios HTTP aún no implementados: solo existen los repositorios mock.');
  };
}

/**
 * Registra los repositorios según `environment.dataSource`.
 * Para conectar el backend: sustituir el `throw` de `mock` por la implementación HTTP de cada token.
 * Las pantallas nunca importan una implementación concreta, solo los tokens. Todas las implementaciones mock
 * comparten una única `MockDatabase`.
 */
export function provideDataSources(): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: TERM_REPOSITORY, useFactory: mock(() => import('../mock/mock-term.repository').then((m) => m.MockTermRepository)) },
    { provide: GROUP_REPOSITORY, useFactory: mock(() => import('../mock/mock-group.repository').then((m) => m.MockGroupRepository)) },
    { provide: SCHEDULE_REPOSITORY, useFactory: mock(() => import('../mock/mock-schedule.repository').then((m) => m.MockScheduleRepository)) },
    { provide: CATALOG_REPOSITORY, useFactory: mock(() => import('../mock/mock-catalog-directory.repositories').then((m) => m.MockCatalogRepository)) },
    { provide: DIRECTORY_REPOSITORY, useFactory: mock(() => import('../mock/mock-catalog-directory.repositories').then((m) => m.MockDirectoryRepository)) },
    { provide: ANALYTICS_REPOSITORY, useFactory: mock(() => import('../mock/mock-analytics.repository').then((m) => m.MockAnalyticsRepository)) },
  ];
  return makeEnvironmentProviders(providers);
}
