import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Estado de carga: placeholder pulsante con los neutros del sistema (sin frame propio en Figma). */
@Component({
  selector: 'edu-loading-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-3', role: 'status', 'aria-live': 'polite' },
  template: `
    <span class="sr-only">{{ label() }}</span>
    @for (row of rows(); track row) {
      <span class="h-4 animate-pulse rounded-control bg-neutral-bg" [style.width.%]="row"></span>
    }
  `,
})
export class LoadingStateComponent {
  readonly label = input<string>('Cargando…');
  protected readonly rows = () => [100, 82, 64];
}
