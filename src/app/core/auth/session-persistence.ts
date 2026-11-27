import { InjectionToken } from '@angular/core';
import { SessionHint } from './auth.api';

/**
 * Persistencia de la PISTA de sesión para sobrevivir a una recarga (solo demo).
 * NO es un mecanismo de seguridad: guarda `{userId, mustChangePassword, refreshExpiresAt}`,
 * jamás contraseñas ni tokens. La identidad y los roles se vuelven a resolver con `AuthApi.restore`.
 */
export interface SessionPersistence {
  read(): SessionHint | null;
  write(hint: SessionHint): void;
  clear(): void;
}

export const SESSION_PERSISTENCE = new InjectionToken<SessionPersistence>('SESSION_PERSISTENCE', {
  providedIn: 'root',
  factory: () => new NoSessionPersistence(),
});

/** Producción / backend real: nada se guarda en el navegador. */
export class NoSessionPersistence implements SessionPersistence {
  read(): SessionHint | null {
    return null;
  }
  write(): void {}
  clear(): void {}
}

const STORAGE_KEY = 'edutrak.demo.session-hint';

/** Demo: `sessionStorage` (se borra al cerrar la pestaña). Todo acceso va en try/catch. */
export class DemoSessionPersistence implements SessionPersistence {
  read(): SessionHint | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data: unknown = JSON.parse(raw);
      if (
        typeof data === 'object' && data !== null &&
        typeof (data as SessionHint).userId === 'string' &&
        typeof (data as SessionHint).mustChangePassword === 'boolean' &&
        typeof (data as SessionHint).refreshExpiresAt === 'string'
      ) {
        const { userId, mustChangePassword, refreshExpiresAt } = data as SessionHint;
        return { userId, mustChangePassword, refreshExpiresAt };
      }
    } catch {
      /* almacenamiento no disponible o contenido corrupto */
    }
    return null;
  }

  write(hint: SessionHint): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(hint));
    } catch {
      /* ignorado: la demo funciona sin persistencia */
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignorado */
    }
  }
}
