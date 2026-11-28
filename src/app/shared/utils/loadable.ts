import { DestroyRef, Signal, inject, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ApiError } from '../../core/data/api-error';

export interface Loadable<T> {
  readonly value: Signal<T | null>;
  readonly loading: Signal<boolean>;
  /** Mensaje de error ya redactado para el usuario, o null. */
  readonly error: Signal<string | null>;
  reload(): void;
}

/**
 * Estado de carga reactivo para una consulta (Signals): `loading`, `value` y `error`, con reintento.
 * Cancela la consulta en curso al recargar o al destruirse el componente. Llamar en un contexto de inyección.
 */
export function loadable<T>(source: () => Observable<T>): Loadable<T> {
  const value = signal<T | null>(null);
  const loading = signal(true);
  const error = signal<string | null>(null);
  let current: Subscription | null = null;

  const reload = (): void => {
    current?.unsubscribe();
    loading.set(true);
    error.set(null);
    current = source().subscribe({
      next: (result) => {
        value.set(result);
        loading.set(false);
      },
      error: (err: unknown) => {
        loading.set(false);
        error.set(err instanceof ApiError && err.status === 403 ? 'No tienes permiso para ver esta información.' : 'No fue posible cargar la información. Inténtalo de nuevo.');
      },
    });
  };

  inject(DestroyRef).onDestroy(() => current?.unsubscribe());
  reload();
  return { value: value.asReadonly(), loading: loading.asReadonly(), error: error.asReadonly(), reload };
}
