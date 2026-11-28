import { Observable, defer, map, of, delay, timer } from 'rxjs';

/** Latencia simulada (ms) de los repositorios mock, para poder ver estados de carga. */
export const MOCK_LATENCY_MS = 250;

export function mockResponse<T>(value: T, latencyMs: number = MOCK_LATENCY_MS): Observable<T> {
  return of(value).pipe(delay(latencyMs));
}

/**
 * Ejecuta `produce` DESPUÉS de la latencia simulada (así lee el estado vigente, como una petición real).
 * Si `produce` lanza (p. ej. `ApiError`), el observable emite ese error.
 */
export function mockCall<T>(produce: () => T, latencyMs: number = MOCK_LATENCY_MS): Observable<T> {
  return defer(() => timer(latencyMs)).pipe(map(produce));
}
