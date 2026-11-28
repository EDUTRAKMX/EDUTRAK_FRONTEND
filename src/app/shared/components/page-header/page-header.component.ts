import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Cabecera de pantalla del Director (Figma 69:960, 72:3849, 83:6248: título 28 bold, subtítulo 12, acción primaria a la
 * derecha; en móvil, título 24 y la acción ocupa todo el ancho debajo). `[slot=chip]` admite la etiqueta del periodo
 * junto al título; `[slot=action]`, el botón principal.
 */
@Component({
  selector: 'edu-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between' },
  template: `
    <div class="flex min-w-0 flex-col gap-[2px]">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="m-0 text-[24px] font-bold leading-[normal] text-ink lg:text-[28px]">{{ title() }}</h1>
        <ng-content select="[slot=chip]" />
      </div>
      @if (subtitle(); as sub) {
        <p class="m-0 text-[12px] leading-[normal] text-muted">{{ sub }}</p>
      }
    </div>
    <div class="flex shrink-0 flex-col gap-2 lg:flex-row [&>*]:lg:w-auto">
      <ng-content select="[slot=action]" />
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
