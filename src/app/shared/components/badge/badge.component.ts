import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type Tone = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  info: 'bg-info-bg text-info-fg',
  danger: 'bg-danger-bg text-danger-fg',
  neutral: 'bg-neutral-bg text-muted',
};

/** Badge de estado con los pares fondo/texto de las variables de Figma (`... badge`). */
@Component({
  selector: 'edu-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
})
export class BadgeComponent {
  readonly tone = input<Tone>('neutral');

  protected readonly classes = computed(
    () =>
      `inline-flex items-center whitespace-nowrap rounded-full px-[9px] py-[3px] text-[10px] font-semibold leading-[normal] ${TONE_CLASSES[this.tone()]}`,
  );
}
