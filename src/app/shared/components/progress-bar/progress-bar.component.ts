import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ProgressTone = 'primary' | 'warning' | 'danger';

const FILL: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  warning: 'bg-progress-warning',
  danger: 'bg-danger-fg',
};

/**
 * Barra de progreso (Figma Director · Inicio 66:3): pista de 10px, extremos redondeados, relleno `primary`
 * (o ámbar cuando el valor es bajo). Semántica `progressbar` con valor y etiqueta accesibles.
 */
@Component({
  selector: 'edu-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-[10px] w-full overflow-clip rounded-full bg-neutral-bg',
    role: 'progressbar',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'clamped()',
    '[attr.aria-label]': 'label()',
  },
  template: `<span class="block h-full rounded-full" [class]="fill()" [style.width.%]="clamped()"></span>`,
})
export class ProgressBarComponent {
  readonly value = input.required<number>();
  readonly tone = input<ProgressTone>('primary');
  readonly label = input<string>('Progreso');

  protected readonly clamped = computed(() => Math.min(100, Math.max(0, this.value())));
  protected fill(): string {
    return FILL[this.tone()];
  }
}
