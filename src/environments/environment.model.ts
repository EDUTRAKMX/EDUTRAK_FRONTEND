/** Origen de datos de los repositorios. `http` aún no está implementado (Fase 1). */
export type DataSource = 'mock' | 'http';

export interface AppEnvironment {
  /** true en builds optimizados (producción o demo). */
  readonly production: boolean;
  /**
   * Compilación de demostración explícita con datos simulados.
   * Es la única forma de usar mock en un build `production: true`.
   */
  readonly demoMode: boolean;
  readonly dataSource: DataSource;
  /** Autenticación simulada SOLO para demostración. Debe quedar en false al conectar el backend. */
  readonly mockAuth: boolean;
  /** URL base de la API Go. Vacía mientras no exista integración. */
  readonly apiBaseUrl: string;
}
