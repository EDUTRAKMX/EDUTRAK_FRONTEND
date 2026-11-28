import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  LucideCalendarCheck,
  LucideCalendarDays,
  LucideCalendarX,
  LucideEye,
  LucidePencil,
  LucidePlus,
} from '@lucide/angular';
import { ApiError } from '../../../core/data/api-error';
import { GROUP_REPOSITORY } from '../../../core/data/group.repository';
import { TERM_REPOSITORY } from '../../../core/data/term.repository';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CalloutComponent } from '../../../shared/components/callout/callout.component';
import { ConfirmDialogComponent } from '../../../shared/components/dialog/confirm-dialog.component';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { SearchInputComponent } from '../../../shared/components/form/search-input.component';
import { SegmentedComponent } from '../../../shared/components/form/segmented.component';
import { SelectComponent } from '../../../shared/components/form/select-field.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ActionMenuComponent, MenuItem } from '../../../shared/components/menu/action-menu.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/state/loading-state.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Term, TermStatus } from '../../../shared/models/academic.model';
import { formatShortDate, inclusiveDays } from '../../../shared/utils/date-utils';
import { loadable } from '../../../shared/utils/loadable';
import { NewTermDialogComponent } from './new-term-dialog.component';
import { TERM_STATUS_LABEL, TERM_STATUS_TONE, termWeeks } from './term-utils';

type StatusFilter = '' | TermStatus;
type PendingAction = { readonly kind: 'activate' | 'close'; readonly term: Term };

const TILE: Record<TermStatus, string> = {
  active: 'bg-success-bg text-success-fg',
  closed: 'bg-neutral-bg text-muted',
  draft: 'bg-info-bg text-info-fg',
};

/**
 * Periodos académicos. Desktop: Figma 69:960 (callout, pestañas de estado, tabla). Mobile: Figma 183:6517 (tarjetas,
 * filtro "Periodo", paginación simple). Modal 72:886 / bottom sheet 183:11926 en `NewTermDialogComponent`;
 * menú de acciones 72:3765 / 183:12084.
 *
 * Reglas del backend: el periodo nace `draft`; solo `activate` (draft→active) y `close` (active→closed, final); NO se edita
 * ni se elimina (por eso "Editar" aparece deshabilitada). "Solo un periodo puede estar activo" es una regla del diseño
 * que el backend NO impone (permite varios activos): aquí se aplica en la interfaz y se documenta como discrepancia.
 */
@Component({
  selector: 'edu-periods-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    CalloutComponent,
    ConfirmDialogComponent,
    DialogComponent,
    EmptyStateComponent,
    IconComponent,
    LoadingStateComponent,
    NewTermDialogComponent,
    PageHeaderComponent,
    PaginationComponent,
    SearchInputComponent,
    SegmentedComponent,
    SelectComponent,
    ActionMenuComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5 lg:gap-[26px]">
      <edu-page-header title="Periodos académicos" subtitle="Administra los ciclos escolares de la carrera.">
        <button slot="action" eduButton type="button" (click)="newOpen.set(true)">
          <edu-icon [name]="icons.plus" [size]="18" /> Nuevo periodo
        </button>
      </edu-page-header>

      <edu-callout title="Reglas importantes" [items]="rules" />

      <section class="flex min-w-0 flex-col overflow-clip rounded-card border border-border bg-surface shadow-card-lg" aria-label="Listado de periodos">
        <!-- Filtros -->
        <div class="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between lg:px-[15px] lg:py-4">
          <div class="hidden lg:block">
            <edu-segmented label="Filtrar por estado" [options]="segments()" [value]="status()" (valueChange)="setStatus($event)" />
          </div>
          <div class="flex gap-2 lg:w-[240px]">
            <edu-search-input class="min-w-0 flex-1" label="Buscar periodo" placeholder="Buscar por periodo…" [value]="query()" (valueChange)="setQuery($event)" />
            <edu-select class="w-[110px] shrink-0 lg:hidden" ariaLabel="Filtrar por estado" placeholder="Periodo" [options]="statusOptions" [value]="status()" (valueChange)="setStatus($event)" />
          </div>
        </div>

        @if (terms.loading()) {
          <div class="px-5 pb-6"><edu-loading-state label="Cargando periodos…" /></div>
        } @else if (terms.error(); as message) {
          <edu-empty-state title="No se pudieron cargar los periodos" [description]="message">
            <button type="button" class="rounded-button border border-border px-4 py-2 text-[13px] font-semibold text-ink hover:bg-canvas" (click)="terms.reload()">Reintentar</button>
          </edu-empty-state>
        } @else if (filtered().length === 0) {
          <edu-empty-state title="Sin periodos" [description]="hasFilters() ? 'Ningún periodo coincide con la búsqueda o el filtro.' : 'Crea el primer periodo académico.'" />
        } @else {
          <!-- Escritorio: tabla -->
          <div role="table" aria-label="Periodos académicos" class="hidden flex-col lg:flex">
            <div role="row" class="grid grid-cols-[minmax(0,1fr)_145px_145px_190px_140px] items-center border-y border-border bg-canvas px-[22px] py-3 text-[11px] font-semibold uppercase leading-[normal] tracking-[0.5px] text-muted">
              <span role="columnheader">Periodo</span>
              <span role="columnheader">Inicio</span>
              <span role="columnheader">Fin</span>
              <span role="columnheader">Estado</span>
              <span role="columnheader" class="text-center">Acciones</span>
            </div>
            @for (t of paged(); track t.id) {
              <div role="row" class="grid min-h-[72px] grid-cols-[minmax(0,1fr)_145px_145px_190px_140px] items-center border-b border-border px-[22px] last:border-b-0">
                <span role="cell" class="flex min-w-0 items-center gap-3">
                  <span class="flex size-10 shrink-0 items-center justify-center rounded-control" [class]="tile(t.status)"><edu-icon [name]="icons.calendar" [size]="22" /></span>
                  <span class="flex min-w-0 flex-col">
                    <span class="truncate text-[14px] font-bold leading-[normal] text-ink">{{ t.name }}</span>
                    <span class="text-[12px] leading-[normal] text-muted">{{ weeks(t) }} semanas</span>
                  </span>
                </span>
                <span role="cell" class="text-[14px] leading-[normal] text-ink">{{ short(t.start_date) }}</span>
                <span role="cell" class="text-[14px] leading-[normal] text-ink">{{ short(t.end_date) }}</span>
                <span role="cell">
                  <edu-badge [tone]="statusTone(t.status)">
                    @if (t.status === 'active') { <span class="mr-1 inline-block size-[5px] rounded-full bg-success-fg" aria-hidden="true"></span> }
                    {{ statusLabel(t.status) }}
                  </edu-badge>
                </span>
                <span role="cell" class="flex justify-center">
                  <edu-action-menu [label]="'Acciones de ' + t.name" [items]="menuFor(t)" (selected)="onAction($event, t)" />
                </span>
              </div>
            }
          </div>

          <!-- Móvil: tarjetas -->
          <ul class="m-0 flex list-none flex-col p-0 lg:hidden">
            @for (t of paged(); track t.id) {
              <li class="flex flex-col gap-3 border-t border-border px-4 py-4 first:border-t">
                <div class="flex items-center gap-3">
                  <span class="flex size-10 shrink-0 items-center justify-center rounded-control" [class]="tile(t.status)"><edu-icon [name]="icons.calendar" [size]="22" /></span>
                  <span class="flex min-w-0 flex-1 flex-col">
                    <span class="truncate text-[15px] font-bold leading-[normal] text-ink">{{ t.name }}</span>
                    <span class="text-[13px] leading-[normal] text-muted">{{ weeks(t) }} semanas</span>
                  </span>
                  <edu-badge [tone]="statusTone(t.status)">
                    @if (t.status === 'active') { <span class="mr-1 inline-block size-[5px] rounded-full bg-success-fg" aria-hidden="true"></span> }
                    {{ statusLabel(t.status) }}
                  </edu-badge>
                  <edu-action-menu [label]="'Acciones de ' + t.name" [items]="menuFor(t)" (selected)="onAction($event, t)" />
                </div>
                <dl class="m-0 grid grid-cols-2 text-center">
                  <div><dt class="text-[11px] font-semibold uppercase leading-[normal] tracking-[0.5px] text-muted">Inicio</dt><dd class="m-0 text-[14px] font-semibold leading-[normal] text-ink">{{ short(t.start_date) }}</dd></div>
                  <div><dt class="text-[11px] font-semibold uppercase leading-[normal] tracking-[0.5px] text-muted">Fin</dt><dd class="m-0 text-[14px] font-semibold leading-[normal] text-ink">{{ short(t.end_date) }}</dd></div>
                </dl>
              </li>
            }
          </ul>

          <edu-pagination
            class="border-t border-border"
            noun="periodos"
            [total]="filtered().length"
            [shown]="paged().length"
            [(page)]="page"
            [(pageSize)]="pageSize"
          />
        }
      </section>
    </div>

    <edu-new-term-dialog [(open)]="newOpen" (created)="onCreated($event)" />

    <edu-confirm-dialog
      [open]="!!pending()"
      (openChange)="!$event && !busy() && pending.set(null)"
      [title]="pending()?.kind === 'close' ? 'Cerrar periodo' : 'Activar periodo'"
      [message]="confirmMessage()"
      [confirmLabel]="pending()?.kind === 'close' ? 'Cerrar periodo' : 'Activar periodo'"
      [busy]="busy()"
      (confirmed)="runPending()"
    />

    <edu-dialog [open]="!!viewing()" (openChange)="!$event && viewing.set(null)" title="Detalle del periodo" [subtitle]="viewing()?.name ?? ''" [icon]="icons.calendar">
      @if (viewing(); as v) {
        <dl class="m-0 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] leading-[normal]">
          <div><dt class="text-muted">Estado</dt><dd class="m-0 mt-1"><edu-badge [tone]="statusTone(v.status)">{{ statusLabel(v.status) }}</edu-badge></dd></div>
          <div><dt class="text-muted">Duración</dt><dd class="m-0 mt-1 font-semibold text-ink">{{ weeks(v) }} semanas · {{ days(v) }} días</dd></div>
          <div><dt class="text-muted">Inicio</dt><dd class="m-0 mt-1 font-semibold text-ink">{{ short(v.start_date) }}</dd></div>
          <div><dt class="text-muted">Fin</dt><dd class="m-0 mt-1 font-semibold text-ink">{{ short(v.end_date) }}</dd></div>
          <div class="col-span-2"><dt class="text-muted">Grupos del periodo</dt><dd class="m-0 mt-1 font-semibold text-ink">{{ viewGroups() ?? '…' }}</dd></div>
        </dl>
      }
      <div slot="footer"><button eduButton variant="secondary" type="button" (click)="viewing.set(null)">Cerrar</button></div>
    </edu-dialog>
  `,
})
export class PeriodsPage {
  private readonly termRepo = inject(TERM_REPOSITORY);
  private readonly groupRepo = inject(GROUP_REPOSITORY);
  private readonly toast = inject(ToastService);

  protected readonly terms = loadable(() => this.termRepo.list());
  protected readonly icons = { plus: LucidePlus, calendar: LucideCalendarDays };
  protected readonly rules = [
    'Solo un periodo puede estar activo.',
    'Cerrar un periodo deja la operación académica en modo de consulta.',
  ];
  protected readonly statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'draft', label: 'Planeado' },
    { value: 'closed', label: 'Cerrado' },
  ];

  protected readonly status = signal<StatusFilter>('');
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly newOpen = signal(false);
  protected readonly pending = signal<PendingAction | null>(null);
  protected readonly busy = signal(false);
  protected readonly viewing = signal<Term | null>(null);
  protected readonly viewGroups = signal<number | null>(null);

  private readonly all = computed(() => [...(this.terms.value() ?? [])].sort((a, b) => b.start_date.localeCompare(a.start_date)));

  protected readonly segments = computed(() => {
    const list = this.all();
    const count = (s: TermStatus) => list.filter((t) => t.status === s).length;
    return [
      { value: '', label: 'Todos', count: list.length },
      { value: 'active', label: 'Activo', count: count('active') },
      { value: 'draft', label: 'Planeado', count: count('draft') },
      { value: 'closed', label: 'Cerrado', count: count('closed') },
    ];
  });

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.all().filter((t) => (!this.status() || t.status === this.status()) && (!q || t.name.toLowerCase().includes(q)));
  });
  protected readonly paged = computed(() => {
    const size = this.pageSize();
    const maxPage = Math.max(1, Math.ceil(this.filtered().length / size));
    const page = Math.min(this.page(), maxPage);
    return this.filtered().slice((page - 1) * size, page * size);
  });
  protected readonly hasFilters = computed(() => !!this.status() || !!this.query().trim());
  protected readonly confirmMessage = computed(() => {
    const p = this.pending();
    if (!p) return '';
    return p.kind === 'close'
      ? `«${p.term.name}» pasará a modo de consulta: se congelan calificaciones, asistencias, justificantes, seguimientos y alertas de sus grupos. Esta acción es definitiva.`
      : `«${p.term.name}» pasará a estar activo y se usará como periodo vigente.`;
  });

  constructor() {
    // Al abrir "Ver", consulta cuántos grupos tiene el periodo.
    effect(() => {
      const term = this.viewing();
      untracked(() => {
        this.viewGroups.set(null);
        if (term) this.groupRepo.list({ academic_term_id: term.id }).subscribe((g) => this.viewGroups.set(g.length));
      });
    });
  }

  protected setStatus(value: string): void {
    this.status.set(value as StatusFilter);
    this.page.set(1);
  }

  protected setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  protected tile(status: TermStatus): string {
    return TILE[status];
  }
  protected statusLabel(status: TermStatus): string {
    return TERM_STATUS_LABEL[status];
  }
  protected statusTone(status: TermStatus) {
    return TERM_STATUS_TONE[status];
  }
  protected weeks(term: Term): number {
    return termWeeks(term);
  }
  protected days(term: Term): number {
    return inclusiveDays(term.start_date, term.end_date);
  }
  protected short(value: string): string {
    return formatShortDate(value);
  }

  /** Ver siempre; Editar deshabilitada (el backend no edita periodos); Activar (planeado) o Cerrar (activo). */
  protected menuFor(term: Term): readonly MenuItem[] {
    const items: MenuItem[] = [
      { id: 'view', label: 'Ver', icon: LucideEye },
      { id: 'edit', label: 'Editar', icon: LucidePencil, disabled: true, reason: 'El backend no permite editar periodos.' },
    ];
    if (term.status === 'draft') items.push({ id: 'activate', label: 'Activar periodo', icon: LucideCalendarCheck });
    if (term.status === 'active') items.push({ id: 'close', label: 'Cerrar periodo', icon: LucideCalendarX });
    return items;
  }

  protected onAction(id: string, term: Term): void {
    if (id === 'view') this.viewing.set(term);
    else if (id === 'activate') {
      const active = this.all().find((t) => t.status === 'active');
      if (active) {
        // Regla de diseño ("solo un periodo activo"); el backend lo permitiría.
        this.toast.error('Ya hay un periodo activo', `Cierra «${active.name}» antes de activar otro.`);
        return;
      }
      this.pending.set({ kind: 'activate', term });
    } else if (id === 'close') this.pending.set({ kind: 'close', term });
  }

  protected onCreated(term: Term): void {
    this.toast.success('Periodo creado', `«${term.name}» se creó como planeado.`);
    this.terms.reload();
  }

  protected runPending(): void {
    const action = this.pending();
    if (!action || this.busy()) return;
    this.busy.set(true);
    const call = action.kind === 'close' ? this.termRepo.close(action.term.id) : this.termRepo.activate(action.term.id);
    call.subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.pending.set(null);
        this.toast.success(action.kind === 'close' ? 'Periodo cerrado' : 'Periodo activado', `«${updated.name}» ahora está ${updated.status === 'closed' ? 'cerrado' : 'activo'}.`);
        this.terms.reload();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.pending.set(null);
        this.toast.error(
          'No se pudo completar la acción',
          error instanceof ApiError && error.code === 'invalid_term_transition'
            ? 'El periodo no puede pasar a ese estado desde el actual.'
            : 'Inténtalo de nuevo.',
        );
        this.terms.reload();
      },
    });
  }
}
