import { InjectionToken } from '@angular/core';
import { AppEnvironment } from '../../../environments/environment.model';

/** Entorno activo (inyectable para facilitar su sustitución en pruebas). */
export const APP_ENV = new InjectionToken<AppEnvironment>('APP_ENV');

/**
 * Impide habilitar datos o autenticación simulados en un build de producción.
 * Solo un build `demo` explícito (`demoMode: true`) puede combinarlos con `production: true`.
 */
export function assertSafeEnvironment(env: AppEnvironment): void {
  const mockInUse = env.mockAuth || env.dataSource === 'mock';
  if (env.production && !env.demoMode && mockInUse) {
    throw new Error(
      'Configuración insegura: mock/autenticación simulada no puede habilitarse en producción. ' +
        'Use el build "demo" explícito o desactive mockAuth y dataSource=mock.',
    );
  }
}
