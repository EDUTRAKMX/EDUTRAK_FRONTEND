import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideIconInput, LucideInbox } from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';

/** Estado "sin registros". No existe un frame específico en Figma: usa los mismos tokens (icono en tile + texto). */
@Component({
  selector: 'edu-empty-state',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col items-center gap-3 px-4 py-10 text-center', role: 'status' },
  template: `
    <span class="flex size-10 items-center justify-center rounded-tile bg-neutral-bg text-muted">
      <edu-icon [name]="icon()" [size]="24" />
    </span>
    <p class="m-0 text-[16px] font-bold text-ink">{{ title() }}</p>
    @if (description(); as text) {
      <p class="m-0 max-w-sm text-[12px] text-muted">{{ text }}</p>
    }
    <ng-content />
  `,
})
export class EmptyStateComponent {
  readonly title = input<string>('Sin registros');
  readonly description = input<string | null>(null);
  readonly icon = input<LucideIconInput>(LucideInbox);
}
