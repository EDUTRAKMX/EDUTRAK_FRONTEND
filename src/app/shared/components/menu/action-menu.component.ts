import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideEllipsisVertical, LucideIconInput } from '@lucide/angular';
import { BreakpointService } from '../../services/breakpoint.service';
import { IconComponent } from '../icon/icon.component';

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIconInput;
  /** Opción visible pero no disponible (p. ej. no soportada por el backend); `reason` explica por qué. */
  readonly disabled?: boolean;
  readonly reason?: string;
}

/**
 * Menú de acciones de fila (kebab). Escritorio: desplegable de 236px (Figma "Dropdown actions" 72:3765, radio 12,
 * borde y sombra). Móvil: bottom sheet (Figma 183:12084). Elementos `menuitem` con flechas, Inicio/Fin, Escape
 * (devuelve el foco al botón) y cierre al hacer clic fuera.
 */
@Component({
  selector: 'edu-action-menu',
  imports: [IconComponent, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-flex', '(document:click)': 'onDocumentClick($event)', '(document:keydown.escape)': 'close(true)' },
  template: `
    <button
      #trigger
      type="button"
      class="flex size-8 items-center justify-center rounded-full text-ink hover:bg-canvas"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.aria-label]="label()"
      (click)="toggle()"
    >
      <edu-icon [name]="kebab" [size]="20" />
    </button>
    @if (open()) {
      @if (desktop()) {
        <div
          role="menu"
          class="absolute right-0 top-[calc(100%+4px)] z-40 flex w-[236px] flex-col rounded-panel border border-border bg-surface p-2 shadow-card-lg"
          (keydown)="onKeydown($event)"
        >
          @for (item of items(); track item.id) {
            <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
          }
        </div>
      } @else {
        <div class="fixed inset-0 z-[60] flex items-end justify-center">
          <div class="absolute inset-0 bg-ink/40" aria-hidden="true" (click)="close(true)"></div>
          <div role="menu" [attr.aria-label]="label()" class="relative flex w-full max-w-[440px] flex-col rounded-t-[20px] border border-border bg-surface px-3 pb-5 pt-2 shadow-modal" (keydown)="onKeydown($event)">
            <span class="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden="true"></span>
            @for (item of items(); track item.id) {
              <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
            }
          </div>
        </div>
      }
    }
    <ng-template #row let-item>
      <button
        type="button"
        role="menuitem"
        class="flex min-h-11 w-full items-center gap-3 rounded-panel px-3 py-2 text-left text-[15px] font-medium leading-[normal] text-muted hover:bg-canvas hover:text-ink focus-visible:bg-canvas focus-visible:text-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted lg:min-h-10 lg:text-[14px]"
        [attr.aria-disabled]="item.disabled ? 'true' : null"
        [attr.title]="item.disabled ? item.reason : null"
        [disabled]="item.disabled"
        (click)="choose(item)"
      >
        <edu-icon [name]="item.icon" [size]="20" />
        {{ item.label }}
      </button>
    </ng-template>
  `,
})
export class ActionMenuComponent {
  readonly items = input.required<readonly MenuItem[]>();
  /** Nombre accesible del botón (p. ej. "Acciones de Sep - Dic 2026"). */
  readonly label = input<string>('Acciones');
  readonly selected = output<string>();

  protected readonly kebab = LucideEllipsisVertical;
  protected readonly open = signal(false);
  protected readonly desktop = inject(BreakpointService).isDesktop;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected toggle(): void {
    if (this.open()) {
      this.close(true);
      return;
    }
    this.open.set(true);
    afterNextRender(() => this.focusItem(0), { injector: this.injector });
  }

  protected close(restoreFocus: boolean): void {
    if (!this.open()) return;
    this.open.set(false);
    if (restoreFocus) this.host.nativeElement.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus();
  }

  protected choose(item: MenuItem): void {
    if (item.disabled) return;
    this.close(true);
    this.selected.emit(item.id);
  }

  protected onDocumentClick(event: Event): void {
    if (this.open() && this.desktop() && !this.host.nativeElement.contains(event.target as Node)) this.close(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const buttons = this.buttons();
    const index = buttons.indexOf(document.activeElement as HTMLElement);
    const move = (to: number): void => {
      event.preventDefault();
      buttons[(to + buttons.length) % buttons.length]?.focus();
    };
    if (event.key === 'ArrowDown') move(index + 1);
    else if (event.key === 'ArrowUp') move(index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(buttons.length - 1);
    else if (event.key === 'Tab') this.close(false);
  }

  private buttons(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'));
  }

  private focusItem(index: number): void {
    this.buttons()[index]?.focus();
  }
}
