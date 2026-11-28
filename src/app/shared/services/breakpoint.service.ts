import { Injectable, signal } from '@angular/core';

/** Breakpoint de layout de la aplicación (`lg` = 1024 px): por debajo, versión móvil (bottom sheets, tarjetas). */
const DESKTOP_QUERY = '(min-width: 1024px)';

/** Expone si el viewport es de escritorio como Signal, para elegir entre variantes Desktop/Mobile del diseño. */
@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private readonly _isDesktop = signal(this.read());
  readonly isDesktop = this._isDesktop.asReadonly();

  constructor() {
    try {
      const mql = window.matchMedia(DESKTOP_QUERY);
      mql.addEventListener('change', (event) => this._isDesktop.set(event.matches));
    } catch {
      /* sin matchMedia (entornos de prueba): se queda con el valor inicial */
    }
  }

  private read(): boolean {
    try {
      return window.matchMedia(DESKTOP_QUERY).matches;
    } catch {
      return true;
    }
  }
}
