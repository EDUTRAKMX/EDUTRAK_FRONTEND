import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Envoltorio de campo de formulario de los modales (Figma 83:5148: etiqueta 16 medium con asterisco rojo, control de
 * 44px, error debajo). Proyecta el control (`edu-select`, `<input>`…); la pantalla enlaza `aria-describedby`
 * con `errorId` / `hintId`.
 */
@Component({
  selector: 'edu-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-[6px]' },
  template: `
    <label [attr.for]="for()" class="text-[15px] font-medium leading-5 text-ink">
      {{ label() }}@if (required()) { <span class="text-danger-fg" aria-hidden="true"> *</span> }
    </label>
    <ng-content />
    @if (error(); as message) {
      <p [id]="for() + '-error'" class="m-0 text-[12px] leading-4 text-danger-fg" role="alert">{{ message }}</p>
    } @else if (hint(); as help) {
      <p [id]="for() + '-hint'" class="m-0 text-[12px] leading-4 text-muted">{{ help }}</p>
    }
  `,
})
export class FieldComponent {
  /** `id` del control proyectado. */
  readonly for = input.required<string>();
  readonly label = input.required<string>();
  readonly required = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
}
