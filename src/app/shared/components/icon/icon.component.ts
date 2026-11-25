import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideDynamicIcon, LucideIconInput } from '@lucide/angular';

/**
 * Icono Lucide (los de Figma son `lucide/*`). Hereda el color del texto (`currentColor`).
 * Con tamaño fijo, el trazo escala con el icono igual que en los frames de Figma.
 */
@Component({
  selector: 'edu-icon',
  imports: [LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0', 'aria-hidden': 'true' },
  template: `<svg [lucideIcon]="name()" [size]="size()" class="block"></svg>`,
})
export class IconComponent {
  readonly name = input.required<LucideIconInput>();
  readonly size = input<number>(16);
}
