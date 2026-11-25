import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideIconInput, LucideInfo, LucideX } from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';
import { ToastKind, ToastService } from './toast.service';

const KIND_STYLE: Record<ToastKind, { tile: string; icon: LucideIconInput }> = {
  success: { tile: 'bg-success-bg text-success-fg', icon: LucideCircleCheck },
  error: { tile: 'bg-danger-bg text-danger-fg', icon: LucideCircleAlert },
  info: { tile: 'bg-info-bg text-info-fg', icon: LucideInfo },
};

/** Contenedor de toasts. Se monta una sola vez en la raíz. Usa el lenguaje de tarjetas de Figma. */
@Component({
  selector: 'edu-toast-host',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col gap-2 sm:left-auto sm:right-5 sm:w-[360px]',
    'aria-live': 'polite',
  },
  template: `
    @for (toast of toasts.toasts(); track toast.id) {
      <div
        class="pointer-events-auto flex items-center gap-2 rounded-card border border-border bg-surface p-3 shadow-card-lg"
        [attr.role]="toast.kind === 'error' ? 'alert' : 'status'"
      >
        <span class="flex size-10 shrink-0 items-center justify-center rounded-button" [class]="style(toast.kind).tile">
          <edu-icon [name]="style(toast.kind).icon" [size]="24" />
        </span>
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <p class="m-0 text-[14px] font-bold leading-[normal] text-ink">{{ toast.title }}</p>
          @if (toast.message) {
            <p class="m-0 text-[12px] leading-[normal] text-muted">{{ toast.message }}</p>
          }
        </div>
        <button
          type="button"
          class="flex size-8 shrink-0 items-center justify-center rounded-button text-muted hover:bg-canvas"
          aria-label="Cerrar notificación"
          (click)="toasts.dismiss(toast.id)"
        >
          <edu-icon [name]="closeIcon" [size]="16" />
        </button>
      </div>
    }
  `,
})
export class ToastHostComponent {
  protected readonly toasts = inject(ToastService);
  protected readonly closeIcon = LucideX;

  protected style(kind: ToastKind) {
    return KIND_STYLE[kind];
  }
}
