import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  LucideCertificate,
  LucideFileText,
  LucideGraduationCap,
  LucideMoon,
  LucideSun,
  LucideUserRoundCheck,
} from '@lucide/angular';
import { SessionStore } from '../../core/auth/session.store';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SectionCardComponent } from '../../shared/components/section-card/section-card.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../shared/components/state/empty-state.component';
import { LoadingStateComponent } from '../../shared/components/state/loading-state.component';
import { ToastService } from '../../shared/components/toast/toast.service';
import { greetingFor, longDayLabel } from '../../shared/utils/date-format';

/**
 * PANTALLA TEMPORAL DE DEMOSTRACIÓN (Fase 1). No es una funcionalidad terminada:
 * sirve para verificar visualmente tokens, componentes compartidos y layouts contra Figma.
 * Las tarjetas replican la cabecera del Inicio del Alumno (Figma 134:5465 / 183:11040).
 * Se reemplaza por las pantallas reales de Inicio en las fases 3 a 6.
 */
@Component({
  selector: 'edu-demo-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    IconComponent,
    SectionCardComponent,
    StatCardComponent,
    EmptyStateComponent,
    LoadingStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-[26px]">
      <div class="flex items-start gap-[6px]">
        <edu-icon [name]="greetingIcon" [size]="32" />
        <div class="flex min-w-0 flex-col gap-[2px]">
          <h1 class="m-0 text-[24px] font-bold leading-[normal] text-ink lg:text-[28px]">{{ greeting }}, {{ firstName }}!</h1>
          <p class="m-0 text-[12px] leading-[normal] text-muted">{{ today }}</p>
        </div>
      </div>

      <p class="m-0 rounded-panel bg-warning-bg px-4 py-3 text-[12px] font-semibold text-warning-fg" role="note">
        Pantalla temporal de demostración (Fase 1): verifica tokens, componentes y layouts. No es una pantalla terminada.
      </p>

      <section class="grid grid-cols-2 gap-[10px] lg:grid-cols-4" aria-label="Indicadores de ejemplo">
        <edu-stat-card label="Promedio" value="84.6" [icon]="icons.average" tone="success">
          <span class="font-semibold text-success-fg">+2.1</span> este periodo
        </edu-stat-card>
        <edu-stat-card label="Asistencia" value="91%" [icon]="icons.attendance" tone="warning">
          <span class="font-semibold text-warning-fg">2</span> faltas
        </edu-stat-card>
        <edu-stat-card label="Materias" value="7" [icon]="icons.subjects" tone="info">5 al corriente</edu-stat-card>
        <edu-stat-card label="Justificantes" value="1" [icon]="icons.justifications" tone="danger">
          Pendiente por tutor
        </edu-stat-card>
      </section>

      <div class="grid gap-[10px] lg:grid-cols-2">
        <edu-section-card title="Componentes" subtitle="Badges, botón y notificaciones">
          <div class="flex flex-wrap gap-2">
            <edu-badge tone="success">Justificado</edu-badge>
            <edu-badge tone="warning">Pendiente</edu-badge>
            <edu-badge tone="info">En revisión</edu-badge>
            <edu-badge tone="danger">Rechazado</edu-badge>
            <edu-badge tone="neutral">Más tarde</edu-badge>
          </div>
          <div class="grid gap-2 sm:grid-cols-3">
            <button eduButton type="button" (click)="toast.success('Guardado', 'Los cambios se aplicaron.')">Éxito</button>
            <button eduButton type="button" (click)="toast.error('No se pudo guardar', 'Inténtalo de nuevo.')">Error</button>
            <button eduButton type="button" (click)="toast.info('Aviso', 'Mensaje informativo.')">Info</button>
          </div>
        </edu-section-card>

        <edu-section-card title="Estados" subtitle="Carga y sin registros">
          <edu-loading-state />
          <edu-empty-state title="Sin registros" description="Cuando existan datos aparecerán aquí." />
        </edu-section-card>
      </div>

    </div>
  `,
})
export class DemoPage {
  protected readonly toast = inject(ToastService);
  protected readonly firstName = inject(SessionStore).user()?.first_name ?? '';

  private readonly now = new Date();
  protected readonly greeting = greetingFor(this.now);
  protected readonly today = longDayLabel(this.now);
  protected readonly greetingIcon = this.now.getHours() < 19 ? LucideSun : LucideMoon;

  protected readonly icons = {
    average: LucideCertificate,
    attendance: LucideUserRoundCheck,
    subjects: LucideGraduationCap,
    justifications: LucideFileText,
  };
}
