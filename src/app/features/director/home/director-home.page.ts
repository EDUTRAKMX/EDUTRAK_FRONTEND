import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideChartColumn,
  LucideChevronRight,
  LucideCircleAlert,
  LucideCircleCheck,
  LucideGraduationCap,
  LucideIconInput,
  LucideMoon,
  LucideSun,
  LucideTrendingDown,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { initialsOf } from '../../../core/auth/profile';
import { SessionStore } from '../../../core/auth/session.store';
import { BadgeComponent, Tone } from '../../../shared/components/badge/badge.component';
import { CountPillComponent } from '../../../shared/components/badge/count-pill.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ProgressBarComponent, ProgressTone } from '../../../shared/components/progress-bar/progress-bar.component';
import { SectionCardComponent } from '../../../shared/components/section-card/section-card.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../../shared/components/state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/state/loading-state.component';
import { greetingFor, longDayLabel } from '../../../shared/utils/date-format';
import { loadable } from '../../../shared/utils/loadable';
import { AlertRule } from '../../../shared/models/analytics.model';
import { DashboardGroupRow, DashboardVm } from './dashboard.vm';
import { DirectorHomeService } from './director-home.service';

interface AlertMeta {
  readonly title: string;
  readonly icon: LucideIconInput;
  readonly tile: string;
  readonly pill: Tone;
}

/** Iconos y tonos de las filas de alertas (Figma 66:3). Los títulos siguen las reglas reales del backend. */
const ALERT_META: Partial<Record<AlertRule, AlertMeta>> = {
  ATTENDANCE_DROP: { title: 'Descenso de asistencia', icon: LucideTrendingDown, tile: 'bg-warning-bg text-warning-fg', pill: 'warning' },
  UNJUSTIFIED_ABSENCES: { title: 'Faltas sin justificar', icon: LucideX, tile: 'bg-danger-bg text-danger-fg', pill: 'danger' },
  GRADE_NA_UNIT: { title: 'Bajo rendimiento reciente', icon: LucideChartColumn, tile: 'bg-info-bg text-info-fg', pill: 'info' },
};

/**
 * Inicio del Director. Desktop: Figma 66:3 (4 tarjetas, Panorama académico, Alertas y tabla de Grupos).
 * Mobile: Figma 183:7804 ("Analítica general", "Promedio General" y alertas; sin tabla de grupos).
 * Todos los indicadores se calculan desde los repositorios (ver `buildDashboard`).
 */
@Component({
  selector: 'edu-director-home-page',
  imports: [
    RouterLink,
    AvatarComponent,
    BadgeComponent,
    CountPillComponent,
    EmptyStateComponent,
    IconComponent,
    LoadingStateComponent,
    ProgressBarComponent,
    SectionCardComponent,
    StatCardComponent,
  ],
  providers: [DirectorHomeService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-[26px]">
      <div class="flex items-start gap-[6px]">
        <edu-icon [name]="greetingIcon" [size]="32" />
        <div class="flex min-w-0 flex-col gap-[2px]">
          <h1 class="m-0 text-[24px] font-bold leading-[normal] text-ink lg:text-[28px]">{{ greeting }}, {{ firstName() }}!</h1>
          <p class="m-0 text-[12px] leading-[normal] text-muted">{{ today }}</p>
        </div>
      </div>

      @if (data.loading()) {
        <edu-section-card title="Cargando indicadores">
          <edu-loading-state label="Cargando el panel del Director…" />
        </edu-section-card>
      } @else if (data.error(); as message) {
        <edu-section-card title="No se pudo cargar el panel">
          <edu-empty-state title="Ocurrió un problema" [description]="message">
            <button type="button" class="rounded-button border border-border px-4 py-2 text-[13px] font-semibold text-ink hover:bg-canvas" (click)="data.reload()">
              Reintentar
            </button>
          </edu-empty-state>
        </edu-section-card>
      } @else if (vm(); as d) {
        @if (!d.term) {
          <edu-section-card title="Sin periodo activo">
            <edu-empty-state
              title="No hay un periodo activo"
              description="Activa un periodo académico para ver los indicadores del Director."
            />
          </edu-section-card>
        } @else {
          <!-- Escritorio: tarjetas de indicadores -->
          <section class="hidden grid-cols-4 gap-[10px] lg:grid" aria-label="Indicadores generales">
            <edu-stat-card label="Grupos activos" [value]="n(d.groupsActive)" [icon]="icons.groups" tone="success">
              @if (d.groupsDelta !== null) {
                <span class="font-semibold text-success-fg">{{ signed(d.groupsDelta) }}</span> este periodo
              } @else {
                en el periodo activo
              }
            </edu-stat-card>
            <edu-stat-card label="Alumnos" [value]="n(d.students)" [icon]="icons.students" tone="info">
              <span class="font-semibold text-info-fg">{{ n(d.studentsWithAlerts) }}</span> con alertas abiertas
            </edu-stat-card>
            <edu-stat-card label="Alertas abiertas" [value]="n(d.openAlerts)" [icon]="icons.alerts" tone="warning">
              <span class="font-semibold text-warning-fg">{{ n(d.needReview) }}</span> requieren revisión
            </edu-stat-card>
            <edu-stat-card label="Asistencia global" [value]="percent(d.attendancePct)" [icon]="icons.attendance" tone="success">
              @if (d.attendanceDeltaPp !== null) {
                <span class="font-semibold" [class]="d.attendanceDeltaPp >= 0 ? 'text-success-fg' : 'text-danger-fg'">{{ signed(d.attendanceDeltaPp, 1) }}pp</span> vs 4 semanas previas
              } @else {
                sin sesiones cerradas
              }
            </edu-stat-card>
          </section>

          <!-- Móvil: Analítica general (Figma 183:7804) -->
          <section
            class="flex flex-col gap-[14px] rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card-lg lg:hidden"
            aria-labelledby="analitica-general"
          >
            <h2 id="analitica-general" class="m-0 text-[18px] font-bold leading-[normal] tracking-[0.72px] text-ink">Analítica general</h2>
            <ul class="m-0 flex list-none flex-col gap-3 p-0">
              <li class="flex items-center gap-3">
                <span class="flex size-8 shrink-0 items-center justify-center rounded-control bg-warning-bg text-warning-fg"><edu-icon [name]="icons.groups" [size]="18" /></span>
                <span class="flex min-w-0 flex-1 flex-col">
                  <span class="text-[13px] font-bold leading-[normal] text-ink">Grupos</span>
                  <span class="text-[11px] leading-[normal] text-muted">{{ n(d.groupsActive) }} activos</span>
                </span>
                <edu-count-pill tone="warning">{{ n(d.groupsActive) }}</edu-count-pill>
              </li>
              <li class="flex items-center gap-3">
                <span class="flex size-8 shrink-0 items-center justify-center rounded-control bg-info-bg text-info-fg"><edu-icon [name]="icons.students" [size]="18" /></span>
                <span class="flex min-w-0 flex-1 flex-col">
                  <span class="text-[13px] font-bold leading-[normal] text-ink">Alumnos</span>
                  <span class="text-[11px] leading-[normal] text-muted">{{ n(d.students) }} activos</span>
                </span>
                <edu-count-pill tone="info">{{ n(d.students) }}</edu-count-pill>
              </li>
              <li class="flex items-center gap-3">
                <span class="flex size-8 shrink-0 items-center justify-center rounded-control bg-success-bg text-success-fg"><edu-icon [name]="icons.attendance" [size]="18" /></span>
                <span class="flex min-w-0 flex-1 flex-col">
                  <span class="text-[13px] font-bold leading-[normal] text-ink">Asistencia global</span>
                  <span class="text-[11px] leading-[normal] text-muted">{{ percent(d.attendancePct) }} total</span>
                </span>
                <edu-count-pill tone="success" [attr.aria-label]="d.needReview + ' alertas por revisar'">{{ n(d.needReview) }}</edu-count-pill>
              </li>
            </ul>
          </section>

          <div class="grid gap-[10px] lg:grid-cols-2">
            <!-- Panorama académico / Promedio General -->
            <section class="flex min-w-0 flex-col gap-4 rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card-lg" aria-labelledby="panorama">
              <header class="flex flex-col">
                <h2 id="panorama" class="m-0 text-[18px] font-bold leading-[normal] tracking-[0.72px] text-ink">
                  <span class="lg:hidden">Promedio General</span><span class="hidden lg:inline">Panorama académico</span>
                </h2>
                <p class="m-0 text-[12px] leading-[normal] text-muted">
                  <span class="lg:hidden">Rendimiento de los alumnos</span><span class="hidden lg:inline">Rendimiento promedio</span>
                </p>
              </header>
              @if (d.averageScore !== null) {
                <p class="m-0 flex items-baseline gap-1 text-ink">
                  <span class="text-[32px] font-bold leading-[normal] tracking-[1.28px]">{{ d.averageScore.toFixed(1) }}</span>
                  <span class="text-[14px] leading-[normal] text-muted">/ 100</span>
                </p>
                <div class="flex flex-col gap-1">
                  <edu-progress-bar [value]="d.averageScore" label="Promedio general de calificaciones" />
                  <div class="flex justify-between text-[12px] leading-[normal] text-muted" aria-hidden="true"><span>0</span><span>50</span><span>100</span></div>
                </div>
                <p class="m-0 text-[12px] leading-[normal] text-muted">{{ trend(d) }}</p>
              } @else {
                <edu-empty-state title="Sin calificaciones" description="Aún no hay unidades capturadas en este periodo." />
              }
            </section>

            <!-- Alertas que requieren atención -->
            <section class="flex min-w-0 flex-col gap-3 rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card-lg" aria-labelledby="alertas">
              <header class="flex items-start justify-between gap-3">
                <h2 id="alertas" class="m-0 text-[18px] font-bold leading-[normal] tracking-[0.72px] text-ink">Alertas que requieren atención</h2>
                <a routerLink="/director/alertas" class="inline-flex shrink-0 items-center gap-[2px] text-[11px] font-bold leading-[normal] text-success-fg hover:underline">
                  Ver más <edu-icon [name]="icons.chevron" [size]="12" />
                </a>
              </header>
              <ul class="m-0 flex list-none flex-col gap-[10px] p-0">
                @for (row of d.alertRows; track row.rule) {
                  @if (meta(row.rule); as m) {
                    <li>
                      <a
                        routerLink="/director/alertas"
                        [queryParams]="{ regla: row.rule }"
                        class="flex items-center gap-3 rounded-panel py-[2px] hover:bg-canvas"
                        [attr.aria-label]="m.title + ': ' + row.students + ' alumnos'"
                      >
                        <span class="flex size-10 shrink-0 items-center justify-center rounded-control" [class]="m.tile"><edu-icon [name]="m.icon" [size]="22" /></span>
                        <span class="flex min-w-0 flex-1 flex-col">
                          <span class="text-[13px] font-bold leading-[normal] text-ink">{{ m.title }}</span>
                          <span class="text-[11px] leading-[normal] text-muted">{{ row.students }} alumnos</span>
                        </span>
                        <edu-count-pill [tone]="m.pill">{{ row.students }}</edu-count-pill>
                        <edu-icon [name]="icons.chevron" [size]="18" class="text-muted" />
                      </a>
                    </li>
                  }
                }
              </ul>
            </section>
          </div>

          <!-- Tabla de grupos (solo escritorio; Figma 66:3) -->
          <section class="hidden min-w-0 flex-col overflow-clip rounded-card border border-border bg-surface shadow-card-lg lg:flex" aria-labelledby="grupos">
            <header class="flex items-start justify-between gap-3 px-[21px] pb-3 pt-[17px]">
              <div class="flex flex-col">
                <h2 id="grupos" class="m-0 text-[18px] font-bold leading-[normal] tracking-[0.72px] text-ink">Grupos</h2>
                <p class="m-0 text-[12px] leading-[normal] text-muted">Mostrando {{ visibleGroups().length }} de {{ d.groupsActive }} grupos</p>
              </div>
              <a routerLink="/director/grupos" class="inline-flex shrink-0 items-center gap-[2px] text-[11px] font-bold leading-[normal] text-success-fg hover:underline">
                Ver todos <edu-icon [name]="icons.chevron" [size]="12" />
              </a>
            </header>
            <div role="table" aria-label="Grupos del periodo activo" class="flex flex-col">
              <div role="row" class="grid grid-cols-[83px_minmax(0,1fr)_130px_252px_173px_56px] items-center border-y border-border bg-canvas px-5 py-[10px] text-[11px] font-semibold uppercase leading-[normal] tracking-[0.5px] text-muted">
                <span role="columnheader">Grupo</span>
                <span role="columnheader">Tutor</span>
                <span role="columnheader">Alumnos</span>
                <span role="columnheader">Asistencia</span>
                <span role="columnheader">Alertas</span>
                <span role="columnheader"><span class="sr-only">Acciones</span></span>
              </div>
              @for (g of visibleGroups(); track g.id) {
                <div
                  role="row"
                  class="grid min-h-[72px] cursor-pointer grid-cols-[83px_minmax(0,1fr)_130px_252px_173px_56px] items-center border-b border-border px-5 last:border-b-0 hover:bg-canvas"
                  (click)="openGroup(g)"
                >
                  <span role="cell" class="text-[14px] font-bold leading-[normal] text-ink">{{ g.code }}</span>
                  <span role="cell" class="flex min-w-0 items-center gap-3">
                    @if (g.tutorName; as tutor) {
                      <edu-avatar [initials]="initials(tutor)" [size]="32" [textSize]="13" />
                      <span class="truncate text-[14px] leading-[normal] text-ink">{{ tutor }}</span>
                    } @else {
                      <edu-badge tone="warning">Sin tutor</edu-badge>
                    }
                  </span>
                  <span role="cell" class="text-[14px] leading-[normal] text-ink">{{ g.students }}</span>
                  <span role="cell" class="flex items-center gap-3">
                    <span class="w-[42px] text-[14px] font-bold leading-[normal] text-ink">{{ percent(g.attendancePct) }}</span>
                    <edu-progress-bar class="max-w-[117px]" [value]="g.attendancePct ?? 0" [tone]="attendanceTone(g)" [label]="'Asistencia del grupo ' + g.code" />
                  </span>
                  <span role="cell"><edu-count-pill [tone]="alertTone(g.alerts)" [attr.aria-label]="g.alerts + ' alertas'">{{ g.alerts }}</edu-count-pill></span>
                  <span role="cell" class="flex justify-end">
                    <a [routerLink]="['/director/grupos', g.id]" class="flex size-8 items-center justify-center rounded-full text-ink hover:bg-border/50" [attr.aria-label]="'Ver grupo ' + g.code" (click)="$event.stopPropagation()">
                      <edu-icon [name]="icons.chevron" [size]="18" />
                    </a>
                  </span>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class DirectorHomePage {
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  private readonly service = inject(DirectorHomeService);

  protected readonly data = loadable(() => this.service.load());
  protected readonly vm = computed<DashboardVm | null>(() => this.data.value());
  /** Figma muestra 4 filas ("Mostrando 4 de 12 grupos"). */
  protected readonly visibleGroups = computed(() => this.vm()?.groups.slice(0, 4) ?? []);
  protected readonly firstName = computed(() => this.session.user()?.first_name ?? '');

  private readonly now = new Date();
  protected readonly greeting = greetingFor(this.now);
  protected readonly today = longDayLabel(this.now);
  protected readonly greetingIcon = this.now.getHours() < 19 ? LucideSun : LucideMoon;

  protected readonly icons = {
    groups: LucideUsers,
    students: LucideGraduationCap,
    alerts: LucideCircleAlert,
    attendance: LucideCircleCheck,
    chevron: LucideChevronRight,
  };

  protected meta(rule: AlertRule): AlertMeta | undefined {
    return ALERT_META[rule];
  }

  protected n(value: number): string {
    return new Intl.NumberFormat('es-MX').format(value);
  }

  protected signed(value: number, digits = 0): string {
    return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`;
  }

  protected percent(value: number | null): string {
    return value === null ? '—' : `${Math.round(value)}%`;
  }

  protected initials(name: string): string {
    return initialsOf(name);
  }

  /** Verde desde 80 %; ámbar por debajo; rojo bajo 60 % (el color de relleno es solo presentación). */
  protected attendanceTone(g: DashboardGroupRow): ProgressTone {
    const value = g.attendancePct ?? 0;
    return value >= 80 ? 'primary' : value >= 60 ? 'warning' : 'danger';
  }

  protected alertTone(count: number): Tone {
    return count >= 5 ? 'danger' : count >= 3 ? 'warning' : 'success';
  }

  protected trend(d: DashboardVm): string {
    const delta = d.averageDelta;
    if (delta === null || Math.abs(delta) < 1) return 'Tendencia estable respecto a la unidad anterior.';
    return delta > 0
      ? `Mejora de ${delta.toFixed(1)} puntos respecto a la unidad anterior.`
      : `Descenso de ${Math.abs(delta).toFixed(1)} puntos respecto a la unidad anterior.`;
  }

  protected openGroup(g: DashboardGroupRow): void {
    void this.router.navigate(['/director/grupos', g.id]);
  }
}
