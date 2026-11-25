import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { provideAuth } from './core/auth/provide-auth';
import { APP_ENV, assertSafeEnvironment } from './core/config/app-config';
import { provideDataSources } from './core/data/provide-data-sources';

assertSafeEnvironment(environment);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Preparado para la integración futura; hasta entonces ningún repositorio ni servicio hace peticiones.
    provideHttpClient(withFetch()),
    { provide: APP_ENV, useValue: environment },
    provideDataSources(),
    provideAuth(),
    // Restauración controlada de la sesión demo (solo existe pista con mockAuth) antes de la primera navegación.
    provideAppInitializer(() => inject(AuthService).restore()),
  ],
};
