import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { LucideIconInput, LucideTriangleAlert } from '@lucide/angular';
import { ButtonComponent } from '../button/button.component';
import { DialogComponent } from './dialog.component';

/**
 * Confirmación de acciones relevantes (p. ej. cerrar un periodo, que es irreversible). Reutiliza el diálogo
 * (modal en escritorio, bottom sheet en móvil). Sin frame propio en Figma (Fase 3): usa tokens y botones existentes.
 */
@Component({
  selector: 'edu-confirm-dialog',
  imports: [DialogComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-dialog [(open)]="open" [title]="title()" [icon]="icon()" [dismissable]="!busy()">
      <p class="m-0 text-[14px] leading-5 text-muted">{{ message() }}</p>
      <div slot="footer" class="flex flex-col-reverse gap-2 lg:flex-row lg:gap-3">
        <button eduButton variant="secondary" type="button" [disabled]="busy()" (click)="open.set(false)">Cancelar</button>
        <button eduButton type="button" data-autofocus [disabled]="busy()" [attr.aria-busy]="busy()" (click)="confirmed.emit()">
          {{ busy() ? 'Procesando…' : confirmLabel() }}
        </button>
      </div>
    </edu-dialog>
  `,
})
export class ConfirmDialogComponent {
  readonly open = model<boolean>(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Confirmar');
  readonly busy = input<boolean>(false);
  readonly icon = input<LucideIconInput | null>(LucideTriangleAlert);
  readonly confirmed = output<void>();
}
