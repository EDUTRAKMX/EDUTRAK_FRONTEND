import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideIconInput } from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';

export type StatTone = 'success' | 'warning' | 'info' | 'danger';

const TILE: Record<StatTone, string> = {
  success: 'bg-success-bg text-success-fg',
  warning: 'bg-warning-bg text-warning-fg',
  info: 'bg-info-bg text-info-fg',
  danger: 'bg-danger-bg text-danger-fg',
};

/**
 * Tarjeta de indicador (Figma 134:5521 escritorio, 183:11061 móvil).
 * Icono y título en fila cuando la tarjeta mide ≥180px de contenido (escritorio ≈233px); apilados si es más
 * estrecha (móvil 174px). La altura (177 / 209px de Figma) resulta del contenido, sin alturas fijas.
 * Separador punteado, valor 32 bold y leyenda proyectada (`<ng-content>`).
 */
@Component({
  selector: 'edu-stat-card',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      '@container flex min-w-0 flex-col gap-4 rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card',
  },
  template: `
    <div
      class="flex flex-col items-start gap-[10px] border-b border-dashed border-border pb-3 @min-[180px]:flex-row @min-[180px]:items-center @min-[180px]:gap-3"
    >
      <span class="flex size-10 shrink-0 items-center justify-center rounded-tile p-2" [class]="tile()">
        <edu-icon [name]="icon()" [size]="24" />
      </span>
      <h3 class="m-0 text-[18px] font-bold leading-[normal] tracking-[0.72px] text-ink">{{ label() }}</h3>
    </div>
    <p class="m-0 text-[32px] font-bold leading-[normal] tracking-[1.28px] text-ink">{{ value() }}</p>
    <p class="m-0 text-[14px] leading-[normal] text-muted"><ng-content /></p>
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input.required<LucideIconInput>();
  readonly tone = input<StatTone>('success');

  protected tile(): string {
    return TILE[this.tone()];
  }
}
