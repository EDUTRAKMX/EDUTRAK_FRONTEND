import { Injector, runInInjectionContext } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';

/**
 * Repositorio cuya implementación se importa de forma diferida (code splitting). Todos los métodos de un repositorio
 * devuelven `Observable`, así que basta un proxy: la primera llamada descarga la clase, la instancia dentro del
 * contexto de inyección y reenvía la invocación. Así los datos mock y la semilla no pesan en el bundle inicial.
 */
export function lazyRepository<T extends object>(injector: Injector, load: () => Promise<new () => T>): T {
  let instance: Promise<T> | null = null;
  const resolve = (): Promise<T> =>
    (instance ??= load().then((ctor) => runInInjectionContext(injector, () => new ctor())));

  return new Proxy({} as T, {
    get(_target, prop) {
      if (typeof prop === 'symbol' || prop === 'then') return undefined;
      return (...args: unknown[]): Observable<unknown> =>
        from(resolve()).pipe(
          switchMap((repo) => (repo as Record<string, (...a: unknown[]) => Observable<unknown>>)[prop](...args)),
        );
    },
  });
}
