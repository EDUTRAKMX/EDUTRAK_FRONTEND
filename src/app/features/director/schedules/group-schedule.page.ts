import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronLeft, LucideClock, LucidePlus } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../../core/data/api-error';
import { DIRECTORY_REPOSITORY } from '../../../core/data/directory.repository';
import { GROUP_REPOSITORY } from '../../../core/data/group.repository';
import { SCHEDULE_REPOSITORY } from '../../../core/data/schedule.repository';
import { TERM_REPOSITORY } from '../../../core/data/term.repository';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { StepperComponent } from '../../../shared/components/form/stepper.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/components/state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/state/loading-state.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Group, Person, ScheduleDetail, TeachingAssignment, Term } from '../../../shared/models/academic.model';
import { fullName } from '../groups/groups.vm';
import { AddClassDialogComponent, AddClassRequest } from './add-class-dialog.component';
import { AddSubjectDialogComponent } from './add-subject-dialog.component';
import {
  PLACEMENT_MESSAGE,
  ScheduleConfig,
  WEEK_DAYS,
  breakOf,
  defaultConfig,
  placedMinutes,
  snapToModule,
  validatePlacement,
} from './schedule-grid';
import { DAY_LONG, DAY_SHORT, durationLabel, fromMinutes, rangeLabel, toMinutes } from './schedule-utils';

/** Píxeles por minuto del calendario (Figma 83:6588: 17:00–21:30 ≈ 350 px). */
const PX_PER_MIN = 1.3;
const ROW_MIN = 5;
/** Paleta por materia (Figma: azul, verde, morado, rojo, naranja…). Clases estáticas para Tailwind. */
const PALETTE = [
  'border-info-fg/40 bg-info-bg text-info-fg',
  'border-success-fg/40 bg-success-bg text-success-fg',
  'border-purple-fg/40 bg-purple-bg text-purple-fg',
  'border-danger-fg/40 bg-danger-bg text-danger-fg',
  'border-warning-fg/40 bg-warning-bg text-warning-fg',
  'border-border bg-neutral-bg text-ink',
];

/** Jornada por grupo, conservada durante la sesión (la jornada no existe en el backend). */
const CONFIGS = new Map<string, ScheduleConfig>();

interface Vm {
  readonly group: Group;
  readonly term: Term;
  readonly tutor: Person | null;
  readonly assignments: readonly TeachingAssignment[];
  readonly groupSlots: readonly ScheduleDetail[];
  readonly allSlots: readonly ScheduleDetail[];
  readonly teacherOf: ReadonlyMap<string, string>;
}

/**
 * Horario del grupo. Desktop: Figma 83:6588 (jornada, materias del grupo, calendario con colocación por clic y por
 * arrastre). Mobile: Figma 183:7136 (lista por día) + "Añadir clase" (325:239).
 *
 * LÍMITES DEL BACKEND: solo se pueden CONSULTAR y AÑADIR franjas (no mover ni eliminar). Jornada y descansos son estado de
 * la interfaz. Además de `schedule_overlap` (misma asignación, regla del backend) la UI impide choques de grupo y de
 * docente, pisar el descanso y salir de la jornada (reglas más estrictas, documentadas).
 */
@Component({
  selector: 'edu-group-schedule-page',
  imports: [AddClassDialogComponent, AddSubjectDialogComponent, ButtonComponent, EmptyStateComponent, IconComponent, LoadingStateComponent, RouterLink, StepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading() && !vm()) {
      <edu-loading-state label="Cargando el horario…" />
    } @else if (error(); as message) {
      <edu-empty-state [title]="error() === 'not-found' ? 'Grupo no encontrado' : 'No se pudo cargar el horario'" description="Vuelve a la lista de horarios o inténtalo de nuevo.">
        <a routerLink="/director/horarios" class="rounded-button border border-border px-4 py-2 text-[13px] font-semibold text-ink hover:bg-canvas">Volver a Horarios</a>
      </edu-empty-state>
    } @else if (vm(); as d) {
      <div class="flex flex-col gap-5">
        <header class="flex items-start gap-3">
          <a routerLink="/director/horarios" class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-ink hover:bg-canvas" aria-label="Volver a Horarios"><edu-icon [name]="icons.back" [size]="22" /></a>
          <div class="flex min-w-0 flex-1 flex-col gap-[2px]">
            <h1 class="m-0 text-[22px] font-bold leading-[normal] text-ink lg:text-[28px]">Horario · {{ d.group.code }}</h1>
            <p class="m-0 text-[12px] leading-[normal] text-muted">
              <span class="hidden lg:inline">Arrastra las materias al calendario, o selecciona una y haz clic en una celda.</span>
              <span class="lg:hidden">{{ d.group.academic_term_name }}</span>
            </p>
          </div>
          @if (editable()) {
            <button eduButton type="button" class="!w-auto !px-4 lg:hidden" (click)="openAddClass()"><edu-icon [name]="icons.plus" [size]="18" /> Añadir clase</button>
          }
        </header>

        @if (notice(); as text) { <p class="m-0 rounded-panel bg-warning-bg px-4 py-3 text-[13px] font-semibold leading-5 text-warning-fg" role="status">{{ text }}</p> }

        <!-- Jornada e intervalos (escritorio) / resumen (móvil) -->
        <section class="flex flex-col gap-4 rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card-lg" aria-labelledby="jornada">
          <header class="flex items-center gap-3 border-b border-dashed border-border pb-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-tile bg-success-bg text-success-fg"><edu-icon [name]="icons.clock" [size]="22" /></span>
            <h2 id="jornada" class="m-0 text-[18px] font-bold leading-[normal] tracking-[0.72px] text-ink">Jornada e intervalos</h2>
          </header>
          <div class="hidden flex-col gap-4 lg:flex">
            <div class="grid grid-cols-4 gap-3">
              <label class="flex flex-col gap-1"><span class="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Inicio</span>
                <edu-stepper label="inicio de jornada" [display]="time(config().start)" [canDecrease]="config().start > 300" [canIncrease]="config().start + 2 * config().classMin < config().end" (decrease)="patch({ start: config().start - 30 })" (increase)="patch({ start: config().start + 30 })" /></label>
              <label class="flex flex-col gap-1"><span class="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Fin de jornada</span>
                <edu-stepper label="fin de jornada" [display]="time(config().end)" [canDecrease]="config().end - 30 >= config().start + 2 * config().classMin" [canIncrease]="config().end < 1410" (decrease)="patch({ end: config().end - 30 })" (increase)="patch({ end: config().end + 30 })" /></label>
              <label class="flex flex-col gap-1"><span class="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Duración de clase</span>
                <edu-stepper label="duración de clase" [display]="config().classMin + ' min'" [canDecrease]="config().classMin > 30" [canIncrease]="config().classMin < 120" (decrease)="patch({ classMin: config().classMin - 5 })" (increase)="patch({ classMin: config().classMin + 5 })" /></label>
              <label class="flex flex-col gap-1"><span class="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Duración del descanso</span>
                <edu-stepper label="duración del descanso" [display]="config().breakMin + ' min'" [canDecrease]="config().breakMin > 0" [canIncrease]="config().breakMin < 60" (decrease)="patch({ breakMin: config().breakMin - 5 })" (increase)="patch({ breakMin: config().breakMin + 5 })" /></label>
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Hora del descanso por día</span>
                <button type="button" class="rounded-control border border-border px-3 py-1 text-[12px] font-semibold text-ink hover:bg-canvas" (click)="equalizeBreaks()">Igualar todos al lunes</button>
              </div>
              <div class="grid grid-cols-5 gap-3">
                @for (day of days; track day) {
                  <label class="flex flex-col gap-1"><span class="text-[12px] font-semibold text-ink">{{ short[day] }}</span>
                    <edu-stepper [label]="'descanso del ' + long[day]" [display]="breakLabel(day)" [canDecrease]="canMoveBreak(day, -1)" [canIncrease]="canMoveBreak(day, 1)" (decrease)="moveBreak(day, -1)" (increase)="moveBreak(day, 1)" /></label>
                }
              </div>
            </div>
          </div>
          <p class="m-0 text-[13px] leading-5 text-muted lg:hidden">Tutor: {{ d.tutor ? name(d.tutor) : 'Sin asignar' }} · Receso diario {{ breakLabel(0) }}</p>
        </section>

        <!-- Escritorio: materias + calendario -->
        <div class="hidden items-start gap-[10px] lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
          <section class="flex min-w-0 flex-col gap-3 rounded-card border border-border bg-surface px-[17px] py-[17px] shadow-card-lg" aria-labelledby="materias">
            <header class="flex items-baseline justify-between gap-2"><h2 id="materias" class="m-0 text-[16px] font-bold leading-[normal] text-ink">Materias del grupo</h2><span class="text-[11px] text-muted">{{ d.assignments.length }} materias</span></header>
            <p class="m-0 text-[12px] leading-4 text-muted">Arrastra una materia a una celda. Elige cuánto dura cada sesión con − y +.</p>
            <ul class="m-0 flex max-h-[420px] list-none flex-col gap-2 overflow-y-auto p-0">
              @for (a of d.assignments; track a.id; let i = $index) {
                <li>
                  <div
                    class="flex flex-col gap-1 rounded-panel border p-3"
                    [class]="palette(i) + (selected() === a.id ? ' ring-2 ring-primary' : '')"
                    [attr.draggable]="editable()"
                    (dragstart)="onDragStart($event, a.id)"
                  >
                    <button type="button" class="flex flex-col items-start gap-[2px] text-left" [attr.aria-pressed]="selected() === a.id" (click)="select(a.id)">
                      <span class="text-[13px] font-bold leading-[normal]">{{ a.subject_name }}</span>
                      <span class="text-[11px] leading-[normal] opacity-80">{{ a.teacher_name }}</span>
                    </button>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[11px] leading-[normal] opacity-80">{{ placed(a.id) }} colocadas</span>
                      <edu-stepper class="w-[156px] !h-8" [label]="'duración de sesión de ' + a.subject_name" [display]="sessionLabel(a.id)" [canDecrease]="modules(a.id) > 1" [canIncrease]="modules(a.id) < 4" (decrease)="setModules(a.id, -1)" (increase)="setModules(a.id, 1)" />
                    </div>
                  </div>
                </li>
              } @empty { <li class="py-4 text-center text-[13px] text-muted">Aún no hay materias asignadas.</li> }
            </ul>
            @if (editable()) {
              <button eduButton type="button" (click)="subjectOpen.set(true)"><edu-icon [name]="icons.plus" [size]="18" /> Agregar materia</button>
              <button type="button" class="rounded-button border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-ink hover:bg-canvas" (click)="openAddClass()">Añadir clase con horas exactas</button>
            }
          </section>

          <section class="min-w-0 rounded-card border border-border bg-surface px-4 py-4 shadow-card-lg" aria-label="Calendario semanal">
            <div class="grid grid-cols-[48px_repeat(5,minmax(0,1fr))] gap-1">
              <span class="flex h-8 items-center justify-center rounded-control bg-canvas text-[11px] font-semibold text-muted">HORA</span>
              @for (day of days; track day) { <span class="flex h-8 items-center justify-center rounded-control bg-canvas text-[12px] font-semibold text-ink">{{ long[day] }}</span> }
            </div>
            <div class="mt-2 grid grid-cols-[48px_repeat(5,minmax(0,1fr))] gap-1">
              <div class="grid text-[11px] text-muted" [style.grid-template-rows]="rowsStyle()" aria-hidden="true">
                @for (label of hourLabels(); track label.row) { <span class="-mt-[6px] text-right" [style.grid-row]="label.row + ' / span 6'">{{ label.text }}</span> }
              </div>
              @for (day of days; track day) {
                <div
                  class="relative grid cursor-pointer rounded-control bg-canvas"
                  [class.cursor-not-allowed]="!editable()"
                  [style.grid-template-rows]="rowsStyle()"
                  [attr.aria-label]="'Columna de ' + long[day]"
                  (click)="onColumnClick($event, day + 1)"
                  (dragover)="$event.preventDefault()"
                  (drop)="onDrop($event, day + 1)"
                >
                  @if (breakRow(day); as b) {
                    <div class="z-[1] flex items-center justify-center rounded-control bg-neutral-bg px-1 text-center text-[9px] font-semibold leading-[normal] text-muted" [style.grid-row]="b" aria-hidden="true">Descanso · {{ breakLabel(day) }}</div>
                  }
                  @for (s of slotsOf(day + 1); track s.id) {
                    <div data-block class="z-[2] flex min-h-0 flex-col gap-[1px] overflow-hidden rounded-control border px-2 py-1" [class]="paletteFor(s)" [style.grid-row]="slotRow(s)" [attr.title]="s.subject_name + ' · ' + s.teacher_name + ' · ' + range(s)">
                      <span class="truncate text-[10px] font-bold leading-[normal]">{{ s.subject_name }}</span>
                      <span class="truncate text-[9px] leading-[normal] opacity-80">{{ s.teacher_name }}</span>
                      <span class="mt-auto text-[9px] font-semibold leading-[normal]">{{ range(s) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
            <p class="m-0 mt-3 text-[11px] leading-4 text-muted">Las franjas añadidas no se pueden mover ni eliminar: el backend solo permite consultar y añadir franjas.</p>
          </section>
        </div>

        <!-- Móvil: lista por día (Figma 183:7136) -->
        <section class="flex flex-col gap-[10px] lg:hidden" aria-label="Horario por día">
          @for (day of days; track day) {
            <article class="flex flex-col gap-2 rounded-card border border-border bg-surface px-[17px] py-[14px] shadow-card">
              <h3 class="m-0 text-[14px] font-bold leading-[normal] text-ink">{{ long[day] }}</h3>
              <ul class="m-0 flex list-none flex-col p-0">
                @for (s of slotsOf(day + 1); track s.id) {
                  <li class="flex flex-col gap-[2px] border-t border-border py-2 first:border-t-0">
                    <span class="text-[12px] font-semibold leading-[normal] text-info-fg">{{ range(s) }}</span>
                    <span class="text-[14px] font-bold leading-[normal] text-ink">{{ s.subject_name }}</span>
                    <span class="text-[11px] leading-[normal] text-muted">{{ s.teacher_name }}</span>
                  </li>
                } @empty { <li class="py-2 text-[13px] text-muted">Sin clases.</li> }
              </ul>
            </article>
          }
        </section>
      </div>

      <edu-add-class-dialog [(open)]="classOpen" [assignments]="classOptions()" [error]="classError()" [busy]="busy()" (submitted)="onAddClass($event)" />
      <edu-add-subject-dialog [(open)]="subjectOpen" [groupId]="d.group.id" [careerId]="d.group.career_id" [level]="d.group.level" [assignedSubjectIds]="assignedSubjects()" (created)="onSubjectAdded($event)" />
    }
  `,
})
export class GroupSchedulePage {
  /** `:groupId` de la ruta (component input binding). */
  readonly groupId = input.required<string>();

  private readonly groups = inject(GROUP_REPOSITORY);
  private readonly terms = inject(TERM_REPOSITORY);
  private readonly schedules = inject(SCHEDULE_REPOSITORY);
  private readonly directory = inject(DIRECTORY_REPOSITORY);
  private readonly toast = inject(ToastService);

  protected readonly icons = { back: LucideChevronLeft, clock: LucideClock, plus: LucidePlus };
  protected readonly days = Array.from({ length: WEEK_DAYS }, (_, i) => i);
  protected readonly short = DAY_SHORT;
  protected readonly long = DAY_LONG;

  protected readonly vm = signal<Vm | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<'not-found' | 'failed' | null>(null);
  protected readonly config = signal<ScheduleConfig>(defaultConfig());
  protected readonly selected = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly classOpen = signal(false);
  protected readonly classError = signal<string | null>(null);
  protected readonly subjectOpen = signal(false);
  private readonly moduleMap = signal<ReadonlyMap<string, number>>(new Map());

  protected readonly editable = computed(() => this.vm()?.term.status !== 'closed');
  protected readonly assignedSubjects = computed(() => this.vm()?.assignments.map((a) => a.subject_id) ?? []);
  protected readonly classOptions = computed(() => (this.vm()?.assignments ?? []).map((a) => ({ id: a.id, label: `${a.subject_name} · ${a.teacher_name}` })));
  protected readonly rowsStyle = computed(() => {
    const c = this.config();
    return `repeat(${Math.ceil((c.end - c.start) / ROW_MIN)}, ${ROW_MIN * PX_PER_MIN}px)`;
  });
  protected readonly hourLabels = computed(() => {
    const c = this.config();
    const out: { row: number; text: string }[] = [];
    for (let t = Math.ceil(c.start / 60) * 60; t < c.end; t += 60) out.push({ row: Math.round((t - c.start) / ROW_MIN) + 1, text: this.time(t) });
    return out;
  });

  constructor() {
    effect(() => {
      const id = this.groupId();
      untracked(() => {
        this.config.set(CONFIGS.get(id) ?? defaultConfig());
        this.selected.set(null);
        this.fetch(false);
      });
    });
    inject(DestroyRef).onDestroy(() => undefined);
  }

  private fetch(silent: boolean): void {
    if (!silent) {
      this.loading.set(true);
      this.error.set(null);
    }
    this.groups.getById(this.groupId()).subscribe({
      next: (group) =>
        forkJoin({
          terms: this.terms.list(),
          assignments: this.groups.listAssignments(group.id),
          all: this.groups.listAllAssignments(),
          slots: this.schedules.list(),
          tutors: this.directory.tutors(),
        }).subscribe({
          next: (r) => {
            const term = r.terms.find((t) => t.id === group.academic_term_id);
            if (!term) return this.fail('failed');
            this.vm.set({
              group,
              term,
              tutor: r.tutors.find((t) => t.id === group.tutor_id) ?? null,
              assignments: r.assignments,
              groupSlots: r.slots.filter((s) => s.group_id === group.id),
              allSlots: r.slots,
              teacherOf: new Map(r.all.map((a) => [a.id, a.teacher_id])),
            });
            this.loading.set(false);
          },
          error: () => this.fail('failed'),
        }),
      error: (e: { status?: number }) => this.fail(e?.status === 404 ? 'not-found' : 'failed'),
    });
  }

  private fail(kind: 'not-found' | 'failed'): void {
    this.loading.set(false);
    this.error.set(kind);
  }

  // ---- presentación
  protected time(minutes: number): string {
    return fromMinutes(minutes);
  }
  protected name(p: Person): string {
    return fullName(p);
  }
  protected range(s: ScheduleDetail): string {
    return rangeLabel(s.start_time, s.end_time);
  }
  protected breakLabel(day: number): string {
    const b = breakOf(this.config(), day);
    return `${fromMinutes(b.start)} – ${fromMinutes(b.end)}`;
  }
  protected palette(i: number): string {
    return PALETTE[i % PALETTE.length];
  }
  protected paletteFor(slot: ScheduleDetail): string {
    const i = this.vm()?.assignments.findIndex((a) => a.id === slot.teaching_assignment_id) ?? 0;
    return PALETTE[Math.max(0, i) % PALETTE.length];
  }
  protected slotsOf(day: number): ScheduleDetail[] {
    const c = this.config();
    return (this.vm()?.groupSlots ?? []).filter((s) => s.day_of_week === day && toMinutes(s.start_time) >= c.start && toMinutes(s.end_time) <= c.end);
  }
  protected slotRow(s: ScheduleDetail): string {
    const c = this.config();
    return `${Math.round((toMinutes(s.start_time) - c.start) / ROW_MIN) + 1} / ${Math.round((toMinutes(s.end_time) - c.start) / ROW_MIN) + 1}`;
  }
  protected breakRow(day: number): string | null {
    const c = this.config();
    const b = breakOf(c, day);
    if (c.breakMin === 0 || b.start < c.start || b.end > c.end) return null;
    return `${Math.round((b.start - c.start) / ROW_MIN) + 1} / ${Math.round((b.end - c.start) / ROW_MIN) + 1}`;
  }
  protected placed(id: string): string {
    return durationLabel(placedMinutes(this.vm()?.groupSlots ?? [], id));
  }
  protected modules(id: string): number {
    return this.moduleMap().get(id) ?? 2;
  }
  protected sessionLabel(id: string): string {
    return durationLabel(this.modules(id) * this.config().classMin);
  }
  protected setModules(id: string, delta: number): void {
    const next = Math.min(4, Math.max(1, this.modules(id) + delta));
    this.moduleMap.set(new Map(this.moduleMap()).set(id, next));
  }

  // ---- jornada
  protected patch(change: Partial<ScheduleConfig>): void {
    const next = { ...this.config(), ...change };
    this.config.set(next);
    CONFIGS.set(this.groupId(), next);
  }
  protected canMoveBreak(day: number, dir: number): boolean {
    const c = this.config();
    const next = c.breakStart[day] + dir * c.classMin;
    return next >= c.start + c.classMin && next + c.breakMin <= c.end - c.classMin;
  }
  protected moveBreak(day: number, dir: number): void {
    if (!this.canMoveBreak(day, dir)) return;
    const c = this.config();
    this.patch({ breakStart: c.breakStart.map((b, i) => (i === day ? b + dir * c.classMin : b)) });
  }
  protected equalizeBreaks(): void {
    const c = this.config();
    this.patch({ breakStart: c.breakStart.map(() => c.breakStart[0]) });
  }

  // ---- colocación
  protected select(id: string): void {
    this.selected.set(this.selected() === id ? null : id);
    this.notice.set(null);
  }
  protected onDragStart(event: DragEvent, id: string): void {
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
    this.selected.set(id);
  }
  protected onColumnClick(event: MouseEvent, day: number): void {
    if ((event.target as HTMLElement).closest('[data-block]')) return;
    const id = this.selected();
    if (!id) {
      this.notice.set('Selecciona una materia de la lista o arrástrala al calendario.');
      return;
    }
    this.placeAt(id, day, this.minuteAt(event));
  }
  protected onDrop(event: DragEvent, day: number): void {
    event.preventDefault();
    const id = event.dataTransfer?.getData('text/plain') || this.selected();
    if (id) this.placeAt(id, day, this.minuteAt(event));
  }
  private minuteAt(event: MouseEvent): number {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return this.config().start + (event.clientY - rect.top) / PX_PER_MIN;
  }

  private placeAt(assignmentId: string, day: number, minute: number): void {
    const start = snapToModule(this.config(), day - 1, minute);
    if (start === null) {
      this.notice.set(PLACEMENT_MESSAGE.outside_hours);
      return;
    }
    this.submit(assignmentId, day, start, start + this.modules(assignmentId) * this.config().classMin, false);
  }

  private submit(assignmentId: string, day: number, start: number, end: number, fromDialog: boolean): void {
    const d = this.vm();
    if (!d || this.busy() || !this.editable()) return;
    const teacherId = d.teacherOf.get(assignmentId) ?? '';
    const err = validatePlacement({
      config: this.config(), day, start, duration: end - start, assignmentId, teacherId, groupId: d.group.id,
      slots: d.allSlots.map((s) => ({ ...s, teacher_id: d.teacherOf.get(s.teaching_assignment_id) ?? '' })),
    });
    if (err) {
      (fromDialog ? this.classError : this.notice).set(PLACEMENT_MESSAGE[err]);
      return;
    }
    this.notice.set(null);
    this.classError.set(null);
    this.busy.set(true);
    this.schedules.add(assignmentId, { day_of_week: day, start_time: fromMinutes(start), end_time: fromMinutes(end) }).subscribe({
      next: () => {
        this.busy.set(false);
        this.classOpen.set(false);
        this.toast.success('Clase añadida', `${DAY_LONG[day - 1]} ${fromMinutes(start)}–${fromMinutes(end)}.`);
        this.fetch(true);
      },
      error: (e: unknown) => {
        this.busy.set(false);
        const text = e instanceof ApiError && e.code === 'schedule_overlap' ? PLACEMENT_MESSAGE.assignment_overlap : 'No fue posible añadir la clase. Inténtalo de nuevo.';
        (fromDialog ? this.classError : this.notice).set(text);
      },
    });
  }

  // ---- diálogos
  protected openAddClass(): void {
    this.classError.set(null);
    this.classOpen.set(true);
  }
  protected onAddClass(req: AddClassRequest): void {
    this.submit(req.assignmentId, req.day, req.start, req.end, true);
  }
  protected onSubjectAdded(a: TeachingAssignment): void {
    this.toast.success('Materia agregada', `${a.subject_name} se asignó a ${a.teacher_name}.`);
    this.fetch(true);
  }
}
