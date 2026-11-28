import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideMinus, LucidePlus } from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';

/**
 * Selector con botones − / + (Figma 83:6588 "Jornada e intervalos" y duración por materia). Muestra un valor ya
 * formateado; la pantalla decide el paso y los límites (`canDecrease` / `canIncrease`).
 */
@Component({
  selector: 'edu-stepper',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex h-10 min-w-0 items-center justify-between gap-1 rounded-button border border-border bg-surface px-1', role: 'group', '[attr.aria-label]': 'label()' },
  template: `
    <button type="button" class="flex size-8 shrink-0 items-center justify-center rounded-control text-ink hover:bg-canvas disabled:opacity-40" [attr.aria-label]="'Disminuir ' + label()" [disabled]="!canDecrease()" (click)="decrease.emit()"><edu-icon [name]="minus" [size]="14" /></button>
    <output class="min-w-0 flex-1 truncate text-center text-[13px] font-semibold leading-[normal] text-ink" aria-live="polite">{{ display() }}</output>
    <button type="button" class="flex size-8 shrink-0 items-center justify-center rounded-control text-ink hover:bg-canvas disabled:opacity-40" [attr.aria-label]="'Aumentar ' + label()" [disabled]="!canIncrease()" (click)="increase.emit()"><edu-icon [name]="plus" [size]="14" /></button>
  `,
})
export class StepperComponent {
  readonly label = input.required<string>();
  readonly display = input.required<string>();
  readonly canDecrease = input<boolean>(true);
  readonly canIncrease = input<boolean>(true);
  readonly decrease = output<void>();
  readonly increase = output<void>();
  protected readonly minus = LucideMinus;
  protected readonly plus = LucidePlus;
}
