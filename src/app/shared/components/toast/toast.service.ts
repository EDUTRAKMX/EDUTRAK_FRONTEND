import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly title: string;
  readonly message?: string;
}

const AUTO_DISMISS_MS = 4000;

/** Notificaciones visuales. Lógica sin dependencias de DOM, fácil de probar. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly _toasts = signal<readonly Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(kind: ToastKind, title: string, message?: string): number {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, kind, title, message }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
    return id;
  }

  success(title: string, message?: string): number {
    return this.show('success', title, message);
  }

  error(title: string, message?: string): number {
    return this.show('error', title, message);
  }

  info(title: string, message?: string): number {
    return this.show('info', title, message);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
