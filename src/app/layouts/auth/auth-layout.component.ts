import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  LucideClipboardList,
  LucideFileText,
  LucideTriangleAlert,
  LucideUserRoundCheck,
} from '@lucide/angular';
import { IconComponent } from '../../shared/components/icon/icon.component';

/**
 * Marco de las pantallas de autenticación (login, cambio de contraseña, acceso denegado).
 * SIN referencia en Figma: diseñado en la Fase 2 con los tokens y el logotipo del sidebar
 * (cuadro `secondary` + "EDUTRAK" + institución). Escritorio: panel de marca + formulario; móvil: solo formulario.
 */
@Component({
  selector: 'edu-auth-layout',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
      <aside class="hidden flex-col justify-between bg-success-bg p-12 lg:flex" aria-hidden="true">
        <div class="flex items-center gap-2">
          <span class="size-10 shrink-0 rounded-button bg-secondary"></span>
          <div class="flex flex-col">
            <span class="text-[20px] font-semibold leading-6 tracking-[-0.3125px] text-primary">EDUTRAK</span>
            <span class="text-[11px] font-light leading-[normal] text-secondary">Universidad Tecnológica de Torreón</span>
          </div>
        </div>
        <div class="flex max-w-[460px] flex-col gap-8">
          <h2 class="m-0 text-[32px] font-bold leading-[40px] text-ink">
            Asistencia, desempeño y seguimiento académico en un solo lugar.
          </h2>
          <ul class="m-0 flex list-none flex-col gap-4 p-0">
            @for (feature of features; track feature.label) {
              <li class="flex items-center gap-3 text-[15px] font-medium leading-6 text-ink">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-panel bg-surface text-success-fg">
                  <edu-icon [name]="feature.icon" [size]="18" />
                </span>
                {{ feature.label }}
              </li>
            }
          </ul>
        </div>
        <p class="m-0 text-[12px] leading-[normal] text-muted">Universidad Tecnológica de Torreón</p>
      </aside>

      <main id="main" class="flex min-w-0 flex-col items-center justify-center px-4 py-8 sm:px-8">
        <div class="flex w-full max-w-[440px] flex-col gap-6">
          <div class="flex items-center gap-2 lg:hidden">
            <span class="size-8 shrink-0 rounded-button bg-secondary" aria-hidden="true"></span>
            <div class="flex flex-col">
              <span class="text-[16px] font-semibold leading-[18px] tracking-[-0.3125px] text-primary">EDUTRAK</span>
              <span class="text-[9px] font-light leading-[normal] text-secondary">Universidad Tecnológica de Torreón</span>
            </div>
          </div>
          <ng-content />
        </div>
      </main>
    </div>
  `,
})
export class AuthLayoutComponent {
  protected readonly features = [
    { icon: LucideUserRoundCheck, label: 'Control de asistencia por clase' },
    { icon: LucideClipboardList, label: 'Calificaciones por unidad' },
    { icon: LucideFileText, label: 'Justificantes con seguimiento' },
    { icon: LucideTriangleAlert, label: 'Alertas de riesgo académico' },
  ];
}
