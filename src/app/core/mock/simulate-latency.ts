import { Observable, delay, of } from 'rxjs';

/** Latencia simulada (ms) de los repositorios mock, para poder ver estados de carga. */
export const MOCK_LATENCY_MS = 250;

export function mockResponse<T>(value: T, latencyMs: number = MOCK_LATENCY_MS): Observable<T> {
  return of(value).pipe(delay(latencyMs));
}
