import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowRight, LucideCalendarDays, LucidePlus, LucideUserPlus, LucideUsers } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import { initialsOf } from '../../../core/auth/profile';
import { ANALYTICS_REPOSITORY } from '../../../core/data/analytics.repository';
import { DIRECTORY_REPOSITORY } from '../../../core/data/directory.repository';
import { GROUP_REPOSITORY } from '../../../core/data/group.repository';
import { TERM_REPOSITORY } from '../../../core/data/term.repository';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent, Tone } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SearchInputComponent } from '../../../shared/components/form/search-input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/form/select-field.component';
import { SwitchComponent } from '../../../shared/components/form/switch.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/state/loading-state.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Group } from '../../../shared/models/academic.model';
import { compactTermName } from '../../../shared/utils/date-format';
import { loadable } from '../../../shared/utils/loadable';
import { AssignTutorDialogComponent } from './assign-tutor-dialog.component';
import { GroupCardVm, buildGroupCards, matchesGroupQuery } from './groups.vm';
import { NewGroupDialogComponent } from './new-group-dialog.component';

const ALL = 'ALL';

/**
 * Grupos. Desktop: Figma 72:3849. Mobile: Figma 183:6738. Tarjetas con tutor (o botón "Asignar tutor" si no hay),
 * conteo de alumnos y alertas (todo derivado de repositorios), filtros (búsqueda, periodo, sección, cuatrimestre,
 * solo con alertas) y paginación. Crear grupo y asignar tutor abren el modal / bottom sheet correspondiente.
 */
@Component({
  selector: 'edu-groups-page',
  imports: [
    AssignTutorDialogComponent,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    IconComponent,
    LoadingStateComponent,
    NewGroupDialogComponent,
    PageHeaderComponent,
    PaginationComponent,
    RouterLink,
    SearchInputComponent,
    SelectComponent,
    SwitchComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5 lg:gap-[22px]">
      <edu-page-header title="Grupos" subtitle="Consulta tutores, alumnos y alertas de cada grupo del periodo.">
        @if (termLabel(); as label) {
          <span slot="chip" class="inline-flex items-center gap-1 rounded-full bg-period-bg px-[9px] py-[4px] text-[11px] font-semibold leading-[normal] text-period-fg">
            <edu-icon [name]="icons.calendar" [size]="12" />{{ label }}
          </span>
        }
        <button slot="action" eduButton type="button" (click)="newOpen.set(true)"><edu-icon [name]="icons.plus" [size]="18" /> Nuevo grupo</button>
      </edu-page-header>

      <div class="flex flex-wrap items-center gap-2" role="search" aria-label="Filtros de grupos">
        <edu-search-input class="min-w-0 flex-1 basis-[200px] lg:max-w-[260px]" label="Buscar grupo o tutor" placeholder="Buscar por grupo o tutor…" [value]="query()" (valueChange)="set(query, $event)" />
        <edu-select class="w-[120px] lg:w-[160px]" ariaLabel="Periodo" [options]="termOptions()" [value]="termValue()" (valueChange)="set(termFilter, $event)" />
        <edu-select class="w-[130px]" ariaLabel="Sección" placeholder="Sección" [options]="sectionOptions()" [value]="section()" (valueChange)="set(section, $event)" />
        <edu-select class="w-[150px]" ariaLabel="Cuatrimestre" placeholder="Cuatrimestre" [options]="levelOptions()" [value]="level()" (valueChange)="set(level, $event)" />
        <edu-switch class="w-full lg:w-auto" label="Solo con alertas" [checked]="onlyAlerts()" (checkedChange)="set(onlyAlerts, $event)" />
      </div>

      @if (data.loading()) {
        <div class="grid gap-[10px] lg:grid-cols-3">
          @for (n of [1, 2, 3]; track n) {
            <div class="rounded-card border border-border bg-surface px-[21px] py-[17px]"><edu-loading-state label="Cargando grupos…" /></div>
          }
        </div>
      } @else if (data.error(); as message) {
        <edu-empty-state title="No se pudieron cargar los grupos" [description]="message">
          <button type="button" class="rounded-button border border-border px-4 py-2 text-[13px] font-semibold text-ink hover:bg-canvas" (click)="data.reload()">Reintentar</button>
        </edu-empty-state>
      } @else if (filtered().length === 0) {
        <edu-empty-state title="Sin grupos" [description]="'Ningún grupo coincide con los filtros seleccionados.'" />
      } @else {
        <ul class="m-0 grid list-none gap-[10px] p-0 lg:grid-cols-3" aria-label="Grupos">
          @for (g of paged(); track g.id) {
            <li>
              <article class="flex h-full flex-col gap-4 rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card">
                <header class="flex items-center gap-3 border-b border-dashed border-border pb-3">
                  <span class="flex size-10 shrink-0 items-center justify-center rounded-tile bg-success-bg text-[16px] font-bold leading-[normal] text-success-fg">{{ g.code }}</span>
                  <div class="flex min-w-0 flex-1 flex-col">
                    <h3 class="m-0 text-[16px] font-bold leading-[normal] text-ink">{{ g.level }}° Cuatrimestre</h3>
                    <p class="m-0 text-[12px] leading-[normal] text-muted">{{ g.section ? 'Sección ' + g.section : g.termName }}</p>
                  </div>
                  <edu-badge [tone]="alertTone(g.alerts)">{{ alertLabel(g.alerts) }}</edu-badge>
                </header>

                @if (g.tutorName; as tutor) {
                  <div class="flex items-center gap-3">
                    <edu-avatar [initials]="initials(tutor)" [size]="32" [textSize]="13" />
                    <div class="flex min-w-0 flex-col">
                      <span class="text-[11px] leading-[normal] text-muted">Tutor</span>
                      <span class="truncate text-[15px] font-bold leading-[normal] text-ink">{{ tutor }}</span>
                    </div>
                  </div>
                } @else if (g.termStatus !== 'closed') {
                  <button type="button" class="flex h-11 w-full items-center justify-center gap-2 rounded-button bg-success-bg text-[15px] font-semibold text-success-fg hover:opacity-90" (click)="assign(g)">
                    <edu-icon [name]="icons.assign" [size]="20" /> Asignar tutor
                  </button>
                } @else {
                  <div class="flex flex-col"><span class="text-[11px] leading-[normal] text-muted">Tutor</span><span class="text-[13px] font-bold uppercase text-warning-fg">Sin asignar</span></div>
                }

                <a [routerLink]="['/director/grupos', g.id]" class="flex items-center justify-between gap-3 rounded-panel bg-canvas px-3 py-2 hover:bg-neutral-bg" [attr.aria-label]="'Ver grupo ' + g.code + ': ' + g.students + ' alumnos'">
                  <span class="flex items-center gap-2 text-[13px] leading-[normal] text-muted"><edu-icon [name]="icons.users" [size]="16" /> Alumnos</span>
                  <span class="flex items-center gap-3">
                    <span class="text-[22px] font-bold leading-[normal] text-ink">{{ g.students }}</span>
                    <span class="flex size-8 items-center justify-center rounded-full border border-border bg-surface text-primary"><edu-icon [name]="icons.arrow" [size]="16" /></span>
                  </span>
                </a>
              </article>
            </li>
          }
        </ul>
        <edu-pagination class="rounded-card border border-border bg-surface shadow-card lg:border-0 lg:bg-transparent lg:shadow-none" noun="grupos" [total]="filtered().length" [shown]="paged().length" [(page)]="page" [(pageSize)]="pageSize" />
      }
    </div>

    <edu-new-group-dialog [(open)]="newOpen" [defaultTermId]="activeTermId()" (created)="onCreated($event)" />
    @if (assigning(); as target) {
      <edu-assign-tutor-dialog
        [open]="true"
        (openChange)="!$event && assigning.set(null)"
        [groupId]="target.id"
        [currentTutorId]="target.tutorId"
        [currentTutorName]="target.tutorName"
        (assigned)="onAssigned($event, target)"
      />
    }
  `,
})
export class GroupsPage {
  private readonly termRepo = inject(TERM_REPOSITORY);
  private readonly groupRepo = inject(GROUP_REPOSITORY);
  private readonly analytics = inject(ANALYTICS_REPOSITORY);
  private readonly directory = inject(DIRECTORY_REPOSITORY);
  private readonly toast = inject(ToastService);

  protected readonly icons = { plus: LucidePlus, calendar: LucideCalendarDays, assign: LucideUserPlus, users: LucideUsers, arrow: LucideArrowRight };

  protected readonly data = loadable(() =>
    forkJoin({
      terms: this.termRepo.list(),
      groups: this.groupRepo.list(),
      overview: this.analytics.overview(),
      tutors: this.directory.tutors(),
    }),
  );

  protected readonly query = signal('');
  /** null = aún sin elegir: se usa el periodo activo. */
  protected readonly termFilter = signal<string | null>(null);
  protected readonly section = signal('');
  protected readonly level = signal('');
  protected readonly onlyAlerts = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly newOpen = signal(false);
  protected readonly assigning = signal<GroupCardVm | null>(null);

  private readonly terms = computed(() => this.data.value()?.terms ?? []);
  protected readonly activeTermId = computed(() => this.terms().find((t) => t.status === 'active')?.id ?? '');
  protected readonly termValue = computed(() => this.termFilter() ?? (this.activeTermId() || ALL));
  protected readonly termLabel = computed(() => {
    const t = this.terms().find((x) => x.id === this.termValue());
    return t ? compactTermName(t.name) : null;
  });

  private readonly cards = computed(() => {
    const d = this.data.value();
    return d ? buildGroupCards(d.groups, d.overview, d.tutors, d.terms) : [];
  });
  /** Tarjetas del periodo elegido (base de las opciones de sección y cuatrimestre). */
  private readonly inTerm = computed(() => this.cards().filter((c) => this.termValue() === ALL || c.termId === this.termValue()));

  protected readonly termOptions = computed<SelectOption[]>(() => [
    { value: ALL, label: 'Todos los periodos' },
    ...[...this.terms()].sort((a, b) => b.start_date.localeCompare(a.start_date)).map((t) => ({ value: t.id, label: t.name })),
  ]);
  protected readonly sectionOptions = computed<SelectOption[]>(() =>
    [...new Set(this.inTerm().map((c) => c.section).filter(Boolean))].sort().map((s) => ({ value: s, label: `Sección ${s}` })),
  );
  protected readonly levelOptions = computed<SelectOption[]>(() =>
    [...new Set(this.inTerm().map((c) => c.level))].sort((a, b) => a - b).map((l) => ({ value: String(l), label: `${l}° Cuatrimestre` })),
  );

  protected readonly filtered = computed(() =>
    this.inTerm().filter(
      (c) =>
        matchesGroupQuery(c, this.query()) &&
        (!this.section() || c.section === this.section()) &&
        (!this.level() || String(c.level) === this.level()) &&
        (!this.onlyAlerts() || c.alerts > 0),
    ),
  );
  protected readonly paged = computed(() => {
    const size = this.pageSize();
    const page = Math.min(this.page(), Math.max(1, Math.ceil(this.filtered().length / size)));
    return this.filtered().slice((page - 1) * size, page * size);
  });

  /** Cambia un filtro y vuelve a la primera página. */
  protected set<T>(target: { set(value: T): void }, value: T): void {
    target.set(value);
    this.page.set(1);
    // Al cambiar de periodo, las opciones de sección/cuatrimestre pueden dejar de existir.
    if (target === (this.termFilter as unknown)) {
      this.section.set('');
      this.level.set('');
    }
  }

  protected initials(name: string): string {
    return initialsOf(name);
  }

  protected alertTone(count: number): Tone {
    return count === 0 ? 'neutral' : count >= 5 ? 'danger' : 'warning';
  }

  protected alertLabel(count: number): string {
    return count === 0 ? 'Sin alertas' : `${count} ${count === 1 ? 'Alerta' : 'Alertas'}`;
  }

  protected assign(card: GroupCardVm): void {
    this.assigning.set(card);
  }

  protected onCreated(group: Group): void {
    this.toast.success('Grupo creado', `Se creó el grupo ${group.code}.`);
    this.data.reload();
  }

  protected onAssigned(group: Group, previous: GroupCardVm): void {
    this.toast.success(group.tutor_id ? 'Tutor asignado' : 'Tutor retirado', `Grupo ${previous.code} actualizado.`);
    this.data.reload();
  }
}
