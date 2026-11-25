import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionCardComponent } from '../../shared/components/section-card/section-card.component';
import { EmptyStateComponent } from '../../shared/components/state/empty-state.component';

/**
 * Marcador temporal de pantallas aún no implementadas (se reemplaza en las fases 3 a 6).
 * Existe para que la navegación del sidebar y del menú móvil sea verificable en la Fase 1.
 */
@Component({
  selector: 'edu-placeholder-page',
  imports: [SectionCardComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-section-card [title]="title()">
      <edu-empty-state
        title="Pantalla pendiente de implementar"
        description="Esta ruta es un marcador temporal de la Fase 1. Su diseño se implementará en una fase posterior."
      />
    </edu-section-card>
  `,
})
export class PlaceholderPage {
  /** Título tomado de `data.title` de la ruta. */
  readonly title = input<string>('Pantalla');
}
