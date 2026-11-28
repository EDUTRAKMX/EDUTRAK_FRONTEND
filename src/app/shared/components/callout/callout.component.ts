import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideInfo } from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';

/**
 * Aviso informativo con viñetas. `card` = "Reglas importantes" de Periodos (Figma 69:960 / 183:6517: tarjeta blanca con
 * icono en tile azul). `panel` = "ANTES DE CREAR" del modal (Figma 72:886 / 183:11926: panel azul con icono relleno).
 */
@Component({
  selector: 'edu-callout',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]':
      "variant() === 'panel' ? 'flex gap-3 rounded-panel border border-info-fg/20 bg-info-bg p-4' : 'flex gap-3 rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card'",
    role: 'note',
  },
  template: `
    @if (variant() === 'panel') {
      <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-info-fg text-white"><edu-icon [name]="info" [size]="18" /></span>
    } @else {
      <span class="flex size-8 shrink-0 items-center justify-center rounded-control bg-info-bg text-info-fg"><edu-icon [name]="info" [size]="20" /></span>
    }
    <div class="flex min-w-0 flex-col gap-1">
      <p class="m-0 font-bold leading-[normal]" [class]="variant() === 'panel' ? 'text-[14px] uppercase text-info-fg' : 'text-[14px] text-ink'">{{ title() }}</p>
      <ul class="m-0 flex list-disc flex-col gap-[2px] pl-4" [class]="variant() === 'panel' ? 'text-[13px] text-info-fg' : 'text-[11px] text-muted'">
        @for (item of items(); track item) {
          <li class="leading-[normal]">{{ item }}</li>
        }
      </ul>
    </div>
  `,
})
export class CalloutComponent {
  readonly title = input.required<string>();
  readonly items = input.required<readonly string[]>();
  readonly variant = input<'card' | 'panel'>('card');
  protected readonly info = LucideInfo;
}
