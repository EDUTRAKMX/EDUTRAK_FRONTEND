import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { APP_ENV, assertSafeEnvironment } from './core/config/app-config';
import { provideDataSources } from './core/data/provide-data-sources';

assertSafeEnvironment(environment);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Preparado para la integración futura; en la Fase 1 ningún repositorio hace peticiones.
    provideHttpClient(withFetch()),
    { provide: APP_ENV, useValue: environment },
    provideDataSources(),
  ],
};
