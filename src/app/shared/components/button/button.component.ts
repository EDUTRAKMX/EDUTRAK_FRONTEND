import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Botón primario de Figma (node 134:5627 "Ver horario"): fondo #029a7b, texto blanco
 * Inter Semi Bold 16/24, padding 18x10, radio 8, ancho completo del contenedor.
 * Solo existe la variante primaria en los frames consultados; otras variantes se
 * añadirán al implementar las pantallas que las usen (modales, Fase 3+).
 */
@Component({
  selector: 'button[eduButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'inline-flex w-full items-center justify-center rounded-button bg-primary px-[18px] py-[10px] text-[16px] font-semibold leading-6 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
  },
  template: `<ng-content />`,
})
export class ButtonComponent {}
