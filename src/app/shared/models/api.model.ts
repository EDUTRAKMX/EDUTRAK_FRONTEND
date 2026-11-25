/** Lista estándar del backend: `{"data":[...]}`. */
export interface ApiList<T> {
  readonly data: readonly T[];
}

/** Cuerpo de error del backend (api/openapi.yaml, schema Error). */
export interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly request_id?: string;
  };
}

/** Listas paginadas (solo seguimientos de tutoría y alertas de analytics). */
export interface Paginated<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}
