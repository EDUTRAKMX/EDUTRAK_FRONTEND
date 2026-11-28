import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideChevronLeft } from '@lucide/angular';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/state/loading-state.component';
import { compactTermName } from '../../../shared/utils/date-format';
import { GroupDetailService } from './group-detail.service';

const ORDINAL = ['', 'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo', 'Undécimo'];

interface Tab {
  readonly path: string;
  readonly label: string;
  /** Ruta absoluta alternativa (la pestaña "Horario" abre la pantalla de horario del grupo). */
  readonly external?: boolean;
}

/**
 * Contenedor del detalle de un grupo: cabecera (Figma 78:4528 / 83:5496; móvil 183:7164 / 183:7336), pestañas de
 * escritorio y `router-outlet` para Resumen y Alumnos. Las pestañas Materias, Profesores, Asistencia, Calificaciones y
 * Alertas existen en el diseño pero sin frames: abren un marcador. "Horario" abre `/director/horarios/:id`.
 * En móvil el diseño no tiene pestañas: flecha de regreso y acceso por las tarjetas.
 */
@Component({
  selector: 'edu-group-detail-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent, EmptyStateComponent, LoadingStateComponent],
  providers: [GroupDetailService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      @if (state.loading() && !state.vm()) {
        <edu-loading-state label="Cargando el grupo…" />
      } @else if (state.error() === 'not-found') {
        <edu-empty-state title="Grupo no encontrado" description="El grupo no existe o fue retirado.">
          <a routerLink="/director/grupos" class="rounded-button border border-border px-4 py-2 text-[13px] font-semibold text-ink hover:bg-canvas">Volver a Grupos</a>
        </edu-empty-state>
      } @else if (state.error()) {
        <edu-empty-state title="No se pudo cargar el grupo" description="Inténtalo de nuevo.">
          <button type="button" class="rounded-button border border-border px-4 py-2 text-[13px] font-semibold text-ink hover:bg-canvas" (click)="state.reload()">Reintentar</button>
        </edu-empty-state>
      } @else if (state.vm(); as d) {
        <header class="flex items-center gap-3">
          <a [routerLink]="backLink()" class="flex size-8 shrink-0 items-center justify-center rounded-full text-ink hover:bg-canvas lg:hidden" aria-label="Volver">
            <edu-icon [name]="back" [size]="22" />
          </a>
          <span class="flex size-12 shrink-0 items-center justify-center rounded-tile bg-primary text-[16px] font-bold leading-[normal] text-white lg:size-[52px] lg:text-[18px]">{{ d.group.code }}</span>
          <div class="flex min-w-0 flex-col">
            <h1 class="m-0 text-[22px] font-bold leading-[normal] text-ink lg:text-[28px]">Grupo {{ d.group.code }}</h1>
            <p class="m-0 text-[12px] leading-[normal] text-muted"><span class="lg:hidden">{{ ordinal(d.group.level) }}</span><span class="hidden lg:inline">{{ d.group.level }}.º cuatrimestre</span> · {{ term(d.term.name) }}</p>
          </div>
        </header>

        <nav class="hidden gap-6 border-b border-border lg:flex" aria-label="Secciones del grupo">
          @for (tab of tabs; track tab.path) {
            <a
              [routerLink]="link(tab, d.group.id)"
              routerLinkActive="!border-primary !text-primary font-bold"
              [routerLinkActiveOptions]="{ exact: true }"
              #rla="routerLinkActive"
              [attr.aria-current]="rla.isActive ? 'page' : null"
              class="-mb-px border-b-2 border-transparent px-1 pb-3 text-[13px] font-medium leading-[normal] text-muted hover:text-ink"
            >{{ tab.label }}</a>
          }
        </nav>

        <router-outlet />
      }
    </div>
  `,
})
export class GroupDetailPage {
  /** Parámetro de ruta `:groupId` (component input binding). */
  readonly groupId = input.required<string>();

  protected readonly state = inject(GroupDetailService);
  private readonly router = inject(Router);
  protected readonly back = LucideChevronLeft;
  protected readonly tabs: readonly Tab[] = [
    { path: '', label: 'Resumen' },
    { path: 'alumnos', label: 'Alumnos' },
    { path: 'materias', label: 'Materias' },
    { path: 'profesores', label: 'Profesores' },
    { path: 'horario', label: 'Horario', external: true },
    { path: 'asistencia', label: 'Asistencia' },
    { path: 'calificaciones', label: 'Calificaciones' },
    { path: 'alertas', label: 'Alertas' },
  ];

  constructor() {
    effect(() => {
      const id = this.groupId();
      untracked(() => this.state.load(id));
    });
    inject(DestroyRef).onDestroy(() => this.state.destroy());
  }

  protected link(tab: Tab, id: string): string[] {
    if (tab.external) return ['/director/horarios', id];
    return tab.path ? ['/director/grupos', id, tab.path] : ['/director/grupos', id];
  }

  /** Desde Alumnos se vuelve al Resumen; desde el Resumen, a la lista. */
  protected backLink(): string[] {
    const id = this.groupId();
    return this.router.url.includes('/alumnos') ? ['/director/grupos', id] : ['/director/grupos'];
  }

  protected ordinal(level: number): string {
    return ORDINAL[level] ?? `Nivel ${level}`;
  }

  protected term(name: string): string {
    return compactTermName(name);
  }
}
