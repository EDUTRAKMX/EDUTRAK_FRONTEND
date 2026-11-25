import { AppEnvironment } from './environment.model';

/** Desarrollo local: datos simulados y autenticación mock. */
export const environment: AppEnvironment = {
  production: false,
  demoMode: false,
  dataSource: 'mock',
  mockAuth: true,
  apiBaseUrl: '',
};
