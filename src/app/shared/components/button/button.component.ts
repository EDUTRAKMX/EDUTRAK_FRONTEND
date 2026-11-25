import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary';

const BASE =
  'inline-flex w-full items-center justify-center gap-2 rounded-button px-[18px] py-[10px] text-[16px] font-semibold leading-6 transition-opacity disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Botón primario de Figma (node 134:5627 "Ver horario"): fondo #029a7b, texto blanco
 * Inter Semi Bold 16/24, padding 18x10, radio 8, ancho completo del contenedor.
 *
 * La variante `secondary` NO está en Figma: se creó en la Fase 2 para las pantallas de autenticación
 * (acciones secundarias como "Cerrar sesión") con los tokens existentes. Revisar al llegar a los modales (Fase 3).
 * Se aplica sobre `<button>` y `<a>`.
 */
@Component({
  selector: 'button[eduButton], a[eduButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');

  protected classes(): string {
    return this.variant() === 'secondary'
      ? `${BASE} border border-border bg-surface text-ink hover:bg-canvas`
      : `${BASE} bg-primary text-white hover:opacity-90`;
  }
}
