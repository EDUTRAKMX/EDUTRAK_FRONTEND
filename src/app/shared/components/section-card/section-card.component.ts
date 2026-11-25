import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Panel de contenido (Figma 134:5554 "Tu horario de hoy", 134:5629 "Avisos relevantes"):
 * fondo surface, borde, radio 20, sombra, padding 22x18, título 18 bold con tracking .72.
 * Proyecta el cuerpo y, opcionalmente, una acción a la derecha del título (`[slot=action]`).
 */
@Component({
  selector: 'edu-section-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex min-w-0 flex-col gap-[22px] rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card-lg',
  },
  template: `
    <header class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-col">
        <h2 class="m-0 text-[18px] font-bold leading-[normal] tracking-[0.72px] text-ink">{{ title() }}</h2>
        @if (subtitle(); as sub) {
          <p class="m-0 mt-0.5 text-[12px] leading-[normal] text-muted">{{ sub }}</p>
        }
      </div>
      <ng-content select="[slot=action]" />
    </header>
    <ng-content />
  `,
})
export class SectionCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
