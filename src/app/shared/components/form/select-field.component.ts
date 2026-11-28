import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { LucideChevronDown } from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Selector tipo botón de los filtros de Figma (40px, borde, chevron): `<select>` nativo con aspecto propio, de modo
 * que conserva teclado, lectores de pantalla y el selector del sistema en móvil. `placeholder` es la opción vacía
 * (p. ej. "Periodo"); con `required` no se ofrece. Sin referencia directa de la lista desplegada en Figma.
 */
@Component({
  selector: 'edu-select',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
  template: `
    <select
      class="h-10 w-full cursor-pointer appearance-none rounded-button border bg-surface pl-3 pr-9 text-[13px] leading-[normal] text-ink hover:border-muted"
      [class]="invalid() ? 'border-danger-fg' : 'border-border'"
      [id]="selectId()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
      [disabled]="disabled()"
      (change)="onChange($event)"
    >
      @if (placeholder(); as text) {
        <option value="" [selected]="value() === ''">{{ text }}</option>
      }
      @for (option of options(); track option.value) {
        <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
      }
    </select>
    <edu-icon [name]="chevron" [size]="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink" />
  `,
})
export class SelectComponent {
  readonly options = input.required<readonly SelectOption[]>();
  readonly value = model<string>('');
  readonly placeholder = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly selectId = input<string | null>(null);
  readonly invalid = input<boolean>(false);
  readonly describedBy = input<string | null>(null);
  readonly disabled = input<boolean>(false);

  protected readonly chevron = LucideChevronDown;

  protected onChange(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
