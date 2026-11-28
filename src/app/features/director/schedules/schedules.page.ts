import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideCalendarPlus, LucidePlus, LucideUserPlus } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import { initialsOf } from '../../../core/auth/profile';
import { ANALYTICS_REPOSITORY } from '../../../core/data/analytics.repository';
import { DIRECTORY_REPOSITORY } from '../../../core/data/directory.repository';
import { GROUP_REPOSITORY } from '../../../core/data/group.repository';
import { SCHEDULE_REPOSITORY } from '../../../core/data/schedule.repository';
import { TERM_REPOSITORY } from '../../../core/data/term.repository';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { FieldComponent } from '../../../shared/components/form/field.component';
import { SearchInputComponent } from '../../../shared/components/form/search-input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/form/select-field.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { CalloutComponent } from '../../../shared/components/callout/callout.component';
import { EmptyStateComponent } from '../../../shared/components/state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/state/loading-state.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { loadable } from '../../../shared/utils/loadable';
import { AssignTutorDialogComponent } from '../groups/assign-tutor-dialog.component';
import { GroupCardVm, buildGroupCards, matchesGroupQuery } from '../groups/groups.vm';

const ALL = 'ALL';

/**
 * Horarios (lista de grupos). Desktop: Figma 83:6248. Mobile: Figma 183:6975. Cada tarjeta abre el horario del grupo
 * (83:6588 / 183:7136). "Crear horario" abre la ventana de 304:508 adaptada al contrato: el backend no guarda
 * horarios con título, siglas ni turno, solo franjas por asignación; por eso la ventana elige el grupo y abre su editor.
 * Los filtros "Carrera" y "Turno" del móvil no tienen soporte (una sola carrera, sin turnos) y no se ofrecen.
 */
@Component({
  selector: 'edu-schedules-page',
  imports: [
    AssignTutorDialogComponent,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    CalloutComponent,
    DialogComponent,
    EmptyStateComponent,
    FieldComponent,
    IconComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    PaginationComponent,
    RouterLink,
    SearchInputComponent,
    SelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5 lg:gap-[22px]">
      <edu-page-header title="Horarios" subtitle="Selecciona un grupo para consultar su horario o genera uno nuevo.">
        <button slot="action" eduButton type="button" (click)="openCreate()"><edu-icon [name]="icons.plus" [size]="18" /> Crear horario</button>
      </edu-page-header>

      <div class="flex flex-wrap items-center gap-2" role="search" aria-label="Filtros de horarios">
        <edu-search-input class="min-w-0 flex-1 basis-[200px] lg:max-w-[260px]" label="Buscar grupo o tutor" placeholder="Buscar por grupo o tutor…" [value]="query()" (valueChange)="setQuery($event)" />
        <edu-select class="w-[160px]" ariaLabel="Periodo" [options]="termOptions()" [value]="termValue()" (valueChange)="setTerm($event)" />
      </div>

      @if (data.loading()) {
        <div class="grid gap-[10px] lg:grid-cols-3">@for (n of [1, 2, 3]; track n) { <div class="rounded-card border border-border bg-surface px-[21px] py-[17px]"><edu-loading-state label="Cargando horarios…" /></div> }</div>
      } @else if (data.error(); as message) {
        <edu-empty-state title="No se pudieron cargar los horarios" [description]="message">
          <button type="button" class="rounded-button border border-border px-4 py-2 text-[13px] font-semibold text-ink hover:bg-canvas" (click)="data.reload()">Reintentar</button>
        </edu-empty-state>
      } @else if (filtered().length === 0) {
        <edu-empty-state title="Sin grupos" description="Ningún grupo coincide con la búsqueda o el periodo." />
      } @else {
        <ul class="m-0 grid list-none gap-[10px] p-0 lg:grid-cols-3" aria-label="Grupos con horario">
          @for (g of paged(); track g.id) {
            <li>
              <article class="relative flex h-full flex-col gap-4 rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card">
                <header class="flex items-center gap-3 border-b border-dashed border-border pb-3">
                  <span class="flex size-10 shrink-0 items-center justify-center rounded-tile bg-success-bg text-[16px] font-bold leading-[normal] text-success-fg">{{ g.code }}</span>
                  <div class="flex min-w-0 flex-1 flex-col">
                    <h3 class="m-0 text-[16px] font-bold leading-[normal] text-ink">
                      <a [routerLink]="['/director/horarios', g.id]" class="after:absolute after:inset-0 after:rounded-card hover:underline" [attr.aria-label]="'Ver horario del grupo ' + g.code">{{ g.level }}° Cuatrimestre</a>
                    </h3>
                    <p class="m-0 text-[12px] leading-[normal] text-muted">{{ g.section ? 'Sección ' + g.section : g.termName }}</p>
                  </div>
                  @if (!slotCount(g.id)) { <edu-badge tone="neutral">Sin horario</edu-badge> }
                </header>
                @if (g.tutorName; as tutor) {
                  <div class="flex items-center gap-3">
                    <edu-avatar [initials]="initials(tutor)" [size]="32" [textSize]="13" />
                    <div class="flex min-w-0 flex-col"><span class="text-[11px] leading-[normal] text-muted">Tutor</span><span class="truncate text-[15px] font-bold leading-[normal] text-ink">{{ tutor }}</span></div>
                  </div>
                } @else {
                  <div class="relative z-10 flex items-center justify-between gap-3">
                    <div class="flex min-w-0 flex-col"><span class="text-[11px] leading-[normal] text-muted">Tutor</span><span class="text-[13px] font-bold uppercase leading-[normal] text-warning-fg">Sin asignar tutor</span></div>
                    @if (g.termStatus !== 'closed') {
                      <button type="button" class="inline-flex h-8 items-center gap-1 rounded-control bg-primary px-3 text-[11px] font-bold uppercase text-white hover:opacity-90" (click)="assigning.set(g)"><edu-icon [name]="icons.assign" [size]="14" /> Asignar</button>
                    }
                  </div>
                }
              </article>
            </li>
          }
        </ul>
        <edu-pagination class="rounded-card border border-border bg-surface shadow-card lg:border-0 lg:bg-transparent lg:shadow-none" noun="grupos" [total]="filtered().length" [shown]="paged().length" [(page)]="page" [(pageSize)]="pageSize" />
      }
    </div>

    <edu-dialog [(open)]="createOpen" title="Nuevo horario" subtitle="Selecciona el grupo cuyo horario quieres crear." [icon]="icons.calendar">
      <div class="flex flex-col gap-4">
        <edu-callout variant="panel" title="Aviso" [items]="notes" />
        <edu-field for="schedule-group" label="Grupo" [required]="true" [error]="createError()">
          <edu-select selectId="schedule-group" class="[&_select]:h-11 [&_select]:text-[14px]" placeholder="Selecciona un grupo" [options]="groupOptions()" [invalid]="!!createError()" [describedBy]="createError() ? 'schedule-group-error' : null" [value]="createGroup()" (valueChange)="createGroup.set($event); createError.set(null)" />
        </edu-field>
      </div>
      <div slot="footer" class="flex flex-col-reverse gap-2 lg:flex-row lg:gap-3">
        <button eduButton variant="secondary" type="button" (click)="createOpen.set(false)">Cancelar</button>
        <button eduButton type="button" (click)="goCreate()">Continuar</button>
      </div>
    </edu-dialog>

    @if (assigning(); as target) {
      <edu-assign-tutor-dialog [open]="true" (openChange)="!$event && assigning.set(null)" [groupId]="target.id" [currentTutorId]="target.tutorId" [currentTutorName]="target.tutorName" (assigned)="onAssigned(target)" />
    }
  `,
})
export class SchedulesPage {
  private readonly router = inject(Router);
  private readonly termRepo = inject(TERM_REPOSITORY);
  private readonly groupRepo = inject(GROUP_REPOSITORY);
  private readonly analytics = inject(ANALYTICS_REPOSITORY);
  private readonly directory = inject(DIRECTORY_REPOSITORY);
  private readonly scheduleRepo = inject(SCHEDULE_REPOSITORY);
  private readonly toast = inject(ToastService);

  protected readonly icons = { plus: LucidePlus, calendar: LucideCalendarPlus, assign: LucideUserPlus };
  protected readonly notes = [
    'El horario se arma por materia del grupo, añadiendo franjas por día y hora.',
    'Las franjas añadidas no se pueden mover ni eliminar.',
  ];

  protected readonly data = loadable(() =>
    forkJoin({
      terms: this.termRepo.list(),
      groups: this.groupRepo.list(),
      overview: this.analytics.overview(),
      tutors: this.directory.tutors(),
      slots: this.scheduleRepo.list(),
    }),
  );

  protected readonly query = signal('');
  private readonly termFilter = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly assigning = signal<GroupCardVm | null>(null);
  protected readonly createOpen = signal(false);
  protected readonly createGroup = signal('');
  protected readonly createError = signal<string | null>(null);

  private readonly terms = computed(() => this.data.value()?.terms ?? []);
  protected readonly termValue = computed(() => this.termFilter() ?? (this.terms().find((t) => t.status === 'active')?.id ?? ALL));
  private readonly cards = computed(() => {
    const d = this.data.value();
    return d ? buildGroupCards(d.groups, d.overview, d.tutors, d.terms) : [];
  });
  protected readonly termOptions = computed<SelectOption[]>(() => [
    { value: ALL, label: 'Todos los periodos' },
    ...[...this.terms()].sort((a, b) => b.start_date.localeCompare(a.start_date)).map((t) => ({ value: t.id, label: t.name })),
  ]);
  protected readonly filtered = computed(() =>
    this.cards().filter((c) => (this.termValue() === ALL || c.termId === this.termValue()) && matchesGroupQuery(c, this.query())),
  );
  protected readonly paged = computed(() => {
    const size = this.pageSize();
    const page = Math.min(this.page(), Math.max(1, Math.ceil(this.filtered().length / size)));
    return this.filtered().slice((page - 1) * size, page * size);
  });
  /** Grupos que admiten horario nuevo (periodo no cerrado). */
  protected readonly groupOptions = computed<SelectOption[]>(() =>
    this.cards()
      .filter((c) => c.termStatus !== 'closed')
      .map((c) => ({ value: c.id, label: `${c.code} · ${c.termName}${this.slotCount(c.id) ? '' : ' (sin horario)'}` })),
  );

  protected slotCount(groupId: string): number {
    return this.data.value()?.slots.filter((s) => s.group_id === groupId).length ?? 0;
  }
  protected initials(name: string): string {
    return initialsOf(name);
  }
  protected setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }
  protected setTerm(value: string): void {
    this.termFilter.set(value);
    this.page.set(1);
  }
  protected openCreate(): void {
    this.createGroup.set('');
    this.createError.set(null);
    this.createOpen.set(true);
  }
  protected goCreate(): void {
    if (!this.createGroup()) {
      this.createError.set('Selecciona un grupo.');
      return;
    }
    this.createOpen.set(false);
    void this.router.navigate(['/director/horarios', this.createGroup()]);
  }
  protected onAssigned(group: GroupCardVm): void {
    this.toast.success('Tutor asignado', `Grupo ${group.code} actualizado.`);
    this.data.reload();
  }
}
