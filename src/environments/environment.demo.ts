import { AppEnvironment } from './environment.model';

/** Build de demostración explícito (`ng build --configuration demo`): optimizado, con datos mock. */
export const environment: AppEnvironment = {
  production: true,
  demoMode: true,
  dataSource: 'mock',
  mockAuth: true,
  apiBaseUrl: '',
};
