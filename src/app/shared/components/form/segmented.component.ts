import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface SegmentOption {
  readonly value: string;
  readonly label: string;
  readonly count?: number;
}

/**
 * Filtro segmentado (Figma Periodos 69:960 "Todos · 4 / Activo · 1 / Planeado · 2 / Cerrado · 2" y Alumnos 83:5496):
 * pastillas dentro de una barra gris. Cada opción es un botón con `aria-pressed`.
 */
@Component({
  selector: 'edu-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex max-w-full gap-1 overflow-x-auto rounded-button bg-neutral-bg p-[3px]', role: 'group', '[attr.aria-label]': 'label()' },
  template: `
    @for (option of options(); track option.value) {
      <button
        type="button"
        class="whitespace-nowrap rounded-control px-3 py-[6px] text-[12px] font-semibold leading-[normal]"
        [class]="option.value === value() ? 'bg-surface text-ink shadow-dot' : 'text-muted hover:text-ink'"
        [attr.aria-pressed]="option.value === value()"
        (click)="value.set(option.value)"
      >
        {{ option.label }}@if (option.count !== undefined) { · {{ option.count }} }
      </button>
    }
  `,
})
export class SegmentedComponent {
  readonly options = input.required<readonly SegmentOption[]>();
  readonly value = model<string>('');
  readonly label = input<string>('Filtro');
}
