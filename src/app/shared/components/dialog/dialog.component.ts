import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { LucideIconInput, LucideX } from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';

let nextId = 0;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal (escritorio, Figma 72:886 / 83:5148 / 83:5427: 587px, radio 16, cabecera con icono, pie con acciones) y
 * bottom sheet (móvil, Figma 183:11926 / 183:12006 / 183:12054: ancho completo, asa superior, esquinas superiores).
 * La misma estructura se presenta de una u otra forma con clases responsive (`lg` = 1024px); el contenido que
 * difiere entre ambas versiones lo decide cada pantalla.
 *
 * Accesibilidad: `role="dialog"` + `aria-modal`, foco inicial en el primer control (o `[data-autofocus]`), foco
 * atrapado con Tab, Escape y clic en el fondo cierran, y el foco vuelve al elemento que lo abrió.
 * Mientras `dismissable` sea false (envío en curso) no se puede cerrar.
 */
@Component({
  selector: 'edu-dialog',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape($event)' },
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[60] flex items-end justify-center lg:items-center lg:p-6">
        <div class="absolute inset-0 bg-ink/40" aria-hidden="true" (click)="requestClose()"></div>
        <div
          #panel
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="subtitle() ? descId : null"
          class="relative flex max-h-[calc(100dvh-16px)] w-full max-w-[440px] flex-col overflow-hidden rounded-t-[20px] border border-border bg-surface shadow-modal lg:max-h-[calc(100dvh-48px)] lg:max-w-[587px] lg:rounded-[16px]"
          (keydown)="trapTab($event)"
        >
          <span class="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border lg:hidden" aria-hidden="true"></span>
          <header class="flex shrink-0 items-start gap-4 border-b-0 px-5 pb-3 pt-4 lg:border-b lg:border-border lg:px-6 lg:py-5">
            @if (icon(); as headerIcon) {
              <span class="hidden size-12 shrink-0 items-center justify-center rounded-panel border border-border text-ink shadow-card lg:flex">
                <edu-icon [name]="headerIcon" [size]="24" />
              </span>
            }
            <div class="flex min-w-0 flex-1 flex-col gap-[2px]">
              <h2 [id]="titleId" class="m-0 text-[20px] font-bold leading-[normal] text-ink lg:text-[18px]">{{ title() }}</h2>
              @if (subtitle(); as sub) {
                <p [id]="descId" class="m-0 hidden text-[13px] leading-[normal] text-muted lg:block">{{ sub }}</p>
              }
            </div>
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center rounded-full text-ink hover:bg-canvas disabled:opacity-40"
              aria-label="Cerrar"
              [disabled]="!dismissable()"
              (click)="requestClose()"
            >
              <edu-icon [name]="closeIcon" [size]="22" />
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-4 lg:px-6 lg:py-5">
            <ng-content />
          </div>
          <footer class="shrink-0 border-t border-border px-5 py-4 lg:px-6 lg:py-5">
            <ng-content select="[slot=footer]" />
          </footer>
        </div>
      </div>
    }
  `,
})
export class DialogComponent {
  readonly open = model<boolean>(false);
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  /** Icono de la cabecera (solo escritorio). */
  readonly icon = input<LucideIconInput | null>(null);
  readonly dismissable = input<boolean>(true);
  readonly closed = output<void>();

  protected readonly titleId = `edu-dialog-title-${nextId}`;
  protected readonly descId = `edu-dialog-desc-${nextId++}`;
  protected readonly closeIcon = LucideX;

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly injector = inject(Injector);
  private opener: HTMLElement | null = null;
  private previousOverflow = '';
  private wasOpen = false;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      untracked(() => {
        if (isOpen) {
          this.wasOpen = true;
          this.onOpen();
        } else if (this.wasOpen) {
          this.wasOpen = false;
          this.onClose();
        }
      });
    });
  }

  protected requestClose(): void {
    if (!this.dismissable()) return;
    this.open.set(false);
  }

  protected onEscape(event: Event): void {
    if (this.open() && this.dismissable()) {
      event.stopPropagation();
      this.open.set(false);
    }
  }

  /** Atrapa Tab dentro del diálogo. */
  protected trapTab(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const nodes = Array.from(this.panel()?.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private onOpen(): void {
    this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    afterNextRender(
      () => {
        const panel = this.panel()?.nativeElement;
        const target =
          panel?.querySelector<HTMLElement>('[data-autofocus]') ??
          panel?.querySelector<HTMLElement>(`${FOCUSABLE}:not([aria-label="Cerrar"])`) ??
          panel;
        target?.focus();
      },
      { injector: this.injector },
    );
  }

  private onClose(): void {
    document.body.style.overflow = this.previousOverflow;
    this.opener?.focus();
    this.opener = null;
    this.closed.emit();
  }
}
