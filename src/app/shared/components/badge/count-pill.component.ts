import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tone } from './badge.component';

const TONE: Record<Tone, string> = {
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  info: 'bg-info-bg text-info-fg',
  danger: 'bg-danger-bg text-danger-fg',
  neutral: 'bg-neutral-bg text-muted',
};

/** Contador circular (Figma Director · Inicio 66:3, columna "Alertas" y filas de alertas): 26px (crece con cifras largas), número en negrita. */
@Component({
  selector: 'edu-count-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
})
export class CountPillComponent {
  readonly tone = input<Tone>('success');

  protected readonly classes = computed(
    () =>
      `inline-flex h-[26px] min-w-[26px] shrink-0 items-center justify-center rounded-full px-[6px] text-[12px] font-bold leading-[normal] ${TONE[this.tone()]}`,
  );
}
