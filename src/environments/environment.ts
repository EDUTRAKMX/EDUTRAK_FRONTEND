import { AppEnvironment } from './environment.model';

/** Producción: sin mock ni autenticación simulada. */
export const environment: AppEnvironment = {
  production: true,
  demoMode: false,
  dataSource: 'http',
  mockAuth: false,
  apiBaseUrl: '',
};
