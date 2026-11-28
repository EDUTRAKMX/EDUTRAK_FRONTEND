import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideDownload, LucidePlus, LucideUserMinus } from '@lucide/angular';
import { initialsOf } from '../../../core/auth/profile';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SearchInputComponent } from '../../../shared/components/form/search-input.component';
import { SegmentedComponent } from '../../../shared/components/form/segmented.component';
import { SelectComponent } from '../../../shared/components/form/select-field.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ActionMenuComponent, MenuItem } from '../../../shared/components/menu/action-menu.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/state/empty-state.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Enrollment, EnrollmentStatus } from '../../../shared/models/academic.model';
import { downloadCsv } from '../../../shared/utils/csv';
import { EnrollStudentDialogComponent } from './enroll-student-dialog.component';
import { GroupDetailService } from './group-detail.service';
import { fullName } from './groups.vm';

type StatusFilter = '' | EnrollmentStatus;

/**
 * Alumnos del grupo. Desktop: Figma 83:5496 (búsqueda, filtros, "Descargar lista", "Inscribir alumno", tabla).
 * Mobile: Figma 183:7336 (filtros en un selector, filas con matrícula y estado). Estados reales del backend:
 * ACTIVE ("Activo") y WITHDRAWN ("Baja"). "Baja temporal" (Figma) NO existe en el contrato y no se simula.
 * Acciones de fila: el backend no expone dar de baja, así que la opción se muestra deshabilitada.
 */
@Component({
  selector: 'edu-group-students-page',
  imports: [
    ActionMenuComponent,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    EnrollStudentDialogComponent,
    IconComponent,
    PaginationComponent,
    SearchInputComponent,
    SegmentedComponent,
    SelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (vm(); as d) {
      <section class="flex min-w-0 flex-col overflow-clip rounded-card border border-border bg-surface shadow-card-lg" aria-label="Alumnos del grupo">
        <div class="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:px-[15px]">
          <div class="flex gap-2 lg:w-[270px]">
            <edu-search-input class="min-w-0 flex-1" label="Buscar alumno" placeholder="Buscar por matrícula o nombre…" [value]="query()" (valueChange)="setQuery($event)" />
            <edu-select class="w-[96px] shrink-0 lg:hidden" ariaLabel="Filtrar por estado" placeholder="Filtros" [options]="statusOptions" [value]="status()" (valueChange)="setStatus($event)" />
          </div>
          <div class="hidden lg:block">
            <edu-segmented label="Filtrar por estado" [options]="segments()" [value]="status()" (valueChange)="setStatus($event)" />
          </div>
          <div class="flex gap-2 lg:ml-auto">
            <button type="button" class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-button border border-border bg-surface px-4 text-[13px] font-semibold text-ink hover:bg-canvas lg:flex-none" (click)="download()">
              <edu-icon [name]="icons.download" [size]="16" /> Descargar lista
            </button>
            @if (canEnroll()) {
              <button eduButton type="button" class="!h-10 !w-auto flex-1 !px-4 !py-0 !text-[13px] lg:flex-none" (click)="enrollOpen.set(true)">
                <edu-icon [name]="icons.plus" [size]="16" /> Inscribir alumno
              </button>
            }
          </div>
        </div>

        @if (filtered().length === 0) {
          <edu-empty-state title="Sin alumnos" [description]="query() || status() ? 'Ningún alumno coincide con la búsqueda o el filtro.' : 'Este grupo aún no tiene alumnos inscritos.'" />
        } @else {
          <div role="table" aria-label="Alumnos" class="hidden flex-col lg:flex">
            <div role="row" class="grid grid-cols-[minmax(0,1fr)_200px_200px_140px] items-center border-y border-border bg-canvas px-[22px] py-3 text-[11px] font-semibold uppercase leading-[normal] tracking-[0.5px] text-muted">
              <span role="columnheader">Alumn&#64;</span><span role="columnheader">Matrícula</span><span role="columnheader">Estado</span><span role="columnheader" class="text-center">Acciones</span>
            </div>
            @for (e of paged(); track e.id) {
              <div role="row" class="grid min-h-[60px] grid-cols-[minmax(0,1fr)_200px_200px_140px] items-center border-b border-border px-[22px] last:border-b-0">
                <span role="cell" class="flex min-w-0 items-center gap-3">
                  <edu-avatar [initials]="initials(e)" [size]="32" [textSize]="13" />
                  <span class="truncate text-[14px] font-bold leading-[normal] text-ink">{{ name(e) }}</span>
                </span>
                <span role="cell" class="text-[14px] leading-[normal] text-ink">{{ e.student.institutional_number }}</span>
                <span role="cell">
                  <edu-badge [tone]="e.status === 'ACTIVE' ? 'success' : 'neutral'">
                    @if (e.status === 'ACTIVE') { <span class="mr-1 inline-block size-[5px] rounded-full bg-success-fg" aria-hidden="true"></span> }
                    {{ e.status === 'ACTIVE' ? 'Activo' : 'Baja' }}
                  </edu-badge>
                </span>
                <span role="cell" class="flex justify-center"><edu-action-menu [label]="'Acciones de ' + name(e)" [items]="rowMenu" /></span>
              </div>
            }
          </div>

          <ul class="m-0 flex list-none flex-col p-0 lg:hidden">
            @for (e of paged(); track e.id) {
              <li class="flex flex-col gap-2 border-t border-border px-4 py-3">
                <div class="flex items-center gap-3">
                  <edu-avatar [initials]="initials(e)" [size]="32" [textSize]="13" />
                  <span class="min-w-0 flex-1 truncate text-[15px] font-bold leading-[normal] text-ink">{{ name(e) }}</span>
                  <edu-action-menu [label]="'Acciones de ' + name(e)" [items]="rowMenu" />
                </div>
                <div class="flex items-end justify-between gap-3">
                  <dl class="m-0"><dt class="text-[10px] font-semibold uppercase leading-[normal] tracking-[0.5px] text-muted">Matrícula</dt><dd class="m-0 text-[14px] leading-[normal] text-ink">{{ e.student.institutional_number }}</dd></dl>
                  <edu-badge [tone]="e.status === 'ACTIVE' ? 'success' : 'neutral'">{{ e.status === 'ACTIVE' ? 'Activo' : 'Baja' }}</edu-badge>
                </div>
              </li>
            }
          </ul>

          <edu-pagination class="border-t border-border" noun="alumnos" [total]="filtered().length" [shown]="paged().length" [(page)]="page" [(pageSize)]="pageSize" />
        }
      </section>

      <edu-enroll-student-dialog [(open)]="enrollOpen" [groupId]="d.group.id" [groupCode]="d.group.code" [enrolledIds]="activeIds()" (enrolled)="onEnrolled($event)" />
    }
  `,
})
export class GroupStudentsPage {
  private readonly state = inject(GroupDetailService);
  private readonly toast = inject(ToastService);
  protected readonly vm = this.state.vm;
  protected readonly icons = { download: LucideDownload, plus: LucidePlus };
  protected readonly statusOptions = [
    { value: 'ACTIVE', label: 'Activos' },
    { value: 'WITHDRAWN', label: 'Baja' },
  ];
  protected readonly rowMenu: readonly MenuItem[] = [
    { id: 'withdraw', label: 'Dar de baja', icon: LucideUserMinus, disabled: true, reason: 'El backend no expone una operación para dar de baja alumnos.' },
  ];

  protected readonly query = signal('');
  protected readonly status = signal<StatusFilter>('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly enrollOpen = signal(false);

  private readonly all = computed(() =>
    [...(this.vm()?.enrollments ?? [])].sort((a, b) => a.student.last_name.localeCompare(b.student.last_name) || a.student.first_name.localeCompare(b.student.first_name)),
  );
  protected readonly canEnroll = computed(() => this.vm()?.term.status !== 'closed');
  protected readonly activeIds = computed(() => this.all().filter((e) => e.status === 'ACTIVE').map((e) => e.student_id));
  protected readonly segments = computed(() => {
    const list = this.all();
    return [
      { value: '', label: 'Todos', count: list.length },
      { value: 'ACTIVE', label: 'Activo', count: list.filter((e) => e.status === 'ACTIVE').length },
      { value: 'WITHDRAWN', label: 'Baja', count: list.filter((e) => e.status === 'WITHDRAWN').length },
    ];
  });
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.all().filter(
      (e) =>
        (!this.status() || e.status === this.status()) &&
        (!q || fullName(e.student).toLowerCase().includes(q) || e.student.institutional_number.includes(q)),
    );
  });
  protected readonly paged = computed(() => {
    const size = this.pageSize();
    const page = Math.min(this.page(), Math.max(1, Math.ceil(this.filtered().length / size)));
    return this.filtered().slice((page - 1) * size, page * size);
  });

  protected name(e: Enrollment): string {
    return fullName(e.student);
  }
  protected initials(e: Enrollment): string {
    return initialsOf(fullName(e.student));
  }
  protected setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }
  protected setStatus(value: string): void {
    this.status.set(value as StatusFilter);
    this.page.set(1);
  }

  /** Exporta la lista filtrada a CSV en el navegador (el backend no ofrece exportaciones). */
  protected download(): void {
    const d = this.vm();
    if (!d) return;
    const rows = [['Matrícula', 'Nombre', 'Estado'], ...this.filtered().map((e) => [e.student.institutional_number, fullName(e.student), e.status === 'ACTIVE' ? 'Activo' : 'Baja'])];
    downloadCsv(`alumnos-${d.group.code}.csv`, rows);
    this.toast.info('Lista descargada', `Se exportaron ${this.filtered().length} alumnos.`);
  }

  protected onEnrolled(e: Enrollment): void {
    this.toast.success('Alumno inscrito', `${fullName(e.student)} se agregó al grupo.`);
    this.state.reload();
  }
}
