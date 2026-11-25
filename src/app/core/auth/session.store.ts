import { Injectable, signal } from '@angular/core';
import { User } from '../../shared/models/user.model';

/**
 * Estado de sesión (Signals). En la Fase 1 solo almacena el usuario; el login,
 * los guards y el cierre de sesión se implementan en la Fase 2.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();

  setUser(user: User): void {
    this._user.set(user);
  }

  clear(): void {
    this._user.set(null);
  }
}
