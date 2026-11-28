import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionCardComponent } from '../../../shared/components/section-card/section-card.component';
import { EmptyStateComponent } from '../../../shared/components/state/empty-state.component';

/**
 * Pestañas del detalle de grupo SIN frame en el diseño entregado (Materias, Profesores, Asistencia, Calificaciones,
 * Alertas). Marcador documentado: no se inventa su contenido.
 */
@Component({
  selector: 'edu-group-tab-placeholder',
  imports: [SectionCardComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-section-card [title]="title()">
      <edu-empty-state title="Sección sin diseño disponible" description="Esta pestaña existe en Figma pero no tiene frames en el alcance de la Fase 3." />
    </edu-section-card>
  `,
})
export class GroupTabPlaceholderPage {
  /** `data.title` de la ruta. */
  readonly title = input<string>('Sección');
}
