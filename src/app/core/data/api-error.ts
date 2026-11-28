/**
 * Error de operación con la forma del backend (`{error:{code,message}}` + estado HTTP).
 * Lo lanzan los repositorios mock y lo lanzará el cliente HTTP, para que la UI no distinga entre ambos.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
