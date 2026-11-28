import { ChangeDetectionStrategy, Component, computed, effect, inject, model, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideCalendarPlus, LucideCircleAlert } from '@lucide/angular';
import { startWith } from 'rxjs';
import { ApiError } from '../../../core/data/api-error';
import { TERM_REPOSITORY } from '../../../core/data/term.repository';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CalloutComponent } from '../../../shared/components/callout/callout.component';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { RangeCalendarComponent } from '../../../shared/components/form/range-calendar.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Term } from '../../../shared/models/academic.model';
import { formatLongDate, formatShortDate, inclusiveDays, weekdayName, weeksOf } from '../../../shared/utils/date-utils';
import { TERM_NAME_MAX, termNameFromRange } from './term-utils';

/**
 * Nuevo periodo académico. Escritorio: Figma 72:886 (modal 587px con calendario de rango). Móvil: Figma 183:11926
 * (bottom sheet SIN calendario: las tarjetas INICIO/FIN abren el selector de fecha nativo).
 * Reglas del backend: el periodo nace `draft` ("Planeado"); `name` ≤ 80 y único (409 `term_name_taken`); inicio < fin (422 `invalid_dates`).
 * El nombre se genera desde el rango, como en el diseño ("Ene - Abr 2027").
 */
@Component({
  selector: 'edu-new-term-dialog',
  imports: [ReactiveFormsModule, BadgeComponent, ButtonComponent, CalloutComponent, DialogComponent, IconComponent, RangeCalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-dialog
      [(open)]="open"
      title="Nuevo periodo académico"
      subtitle="Define el nombre y las fechas del periodo."
      [icon]="headerIcon"
      [dismissable]="!submitting()"
    >
      <form id="new-term-form" class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <edu-callout variant="panel" title="Antes de crear" [items]="notes" />

        @if (serverError(); as message) {
          <p class="m-0 flex items-start gap-2 rounded-panel bg-danger-bg px-4 py-3 text-[13px] leading-5 text-danger-fg" role="alert">
            <edu-icon [name]="alertIcon" [size]="18" class="mt-px" />{{ message }}
          </p>
        }

        <div class="flex flex-col gap-[6px]">
          <label for="term-name" class="text-[14px] font-semibold leading-5 text-ink">Fecha del periodo <span class="text-danger-fg" aria-hidden="true">*</span></label>
          <input
            id="term-name"
            type="text"
            readonly
            class="h-11 w-full rounded-button border border-border bg-surface px-3 text-[14px] text-ink placeholder:text-muted"
            [value]="name()"
            placeholder="Selecciona las fechas del periodo"
            [attr.aria-describedby]="'term-dates-error'"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="relative flex min-w-0 flex-col gap-[2px] rounded-panel border border-border bg-surface px-4 py-3" [class.border-danger-fg]="startError()">
            <span class="text-[11px] font-semibold uppercase leading-[normal] tracking-[0.5px] text-muted">Inicio</span>
            <span class="text-[18px] font-bold leading-[normal] text-ink lg:text-[20px]">{{ startLong() || '—' }}</span>
            <span class="text-[12px] leading-[normal] text-muted">{{ startWeekday() || ' ' }}</span>
            <!-- Móvil: la tarjeta abre el selector de fecha nativo (el diseño móvil no incluye calendario). -->
            <input type="date" class="absolute inset-0 size-full cursor-pointer opacity-0 lg:hidden" aria-label="Fecha de inicio" [formControl]="form.controls.start" (click)="openPicker($event)" />
          </label>
          <label class="relative flex min-w-0 flex-col gap-[2px] rounded-panel border border-border bg-surface px-4 py-3" [class.border-danger-fg]="endError()">
            <span class="text-[11px] font-semibold uppercase leading-[normal] tracking-[0.5px] text-muted">Fin</span>
            <span class="text-[18px] font-bold leading-[normal] text-ink lg:text-[20px]">{{ endLong() || '—' }}</span>
            <span class="text-[12px] leading-[normal] text-muted">{{ endWeekday() || ' ' }}</span>
            <input type="date" class="absolute inset-0 size-full cursor-pointer opacity-0 lg:hidden" aria-label="Fecha de fin" [formControl]="form.controls.end" (click)="openPicker($event)" />
          </label>
        </div>
        <p id="term-dates-error" class="m-0 -mt-2 text-[12px] leading-4 text-danger-fg empty:hidden" role="alert">{{ startError() || endError() }}</p>

        <edu-range-calendar
          class="hidden lg:block"
          [start]="form.controls.start.value"
          [end]="form.controls.end.value"
          (startChange)="form.controls.start.setValue($event)"
          (endChange)="form.controls.end.setValue($event)"
        />

        <section class="flex flex-col gap-3" aria-labelledby="term-preview">
          <h3 id="term-preview" class="m-0 text-[12px] font-semibold uppercase leading-[normal] tracking-[0.5px] text-muted">Vista previa</h3>
          <div class="flex items-center justify-between gap-3 border-b border-dashed border-border pb-3">
            <p class="m-0 text-[20px] font-bold leading-[normal] text-ink">{{ name() || '—' }}</p>
            <edu-badge tone="info">Planeado</edu-badge>
          </div>
          <dl class="m-0 grid grid-cols-3 gap-2 text-[12px] leading-[normal]">
            <div><dt class="text-muted">Inicio</dt><dd class="m-0 font-semibold text-ink">{{ startShort() || '—' }}</dd></div>
            <div><dt class="text-muted">Fin</dt><dd class="m-0 font-semibold text-ink">{{ endShort() || '—' }}</dd></div>
            <div><dt class="text-muted">Duración</dt><dd class="m-0 font-semibold text-ink">{{ duration() || '—' }}</dd></div>
          </dl>
        </section>
      </form>

      <div slot="footer" class="flex flex-col-reverse gap-2 lg:flex-row lg:gap-3">
        <button eduButton variant="secondary" type="button" [disabled]="submitting()" (click)="open.set(false)">Cancelar</button>
        <button eduButton type="submit" form="new-term-form" [disabled]="submitting()" [attr.aria-busy]="submitting()">
          {{ submitting() ? 'Creando…' : 'Crear' }}
        </button>
      </div>
    </edu-dialog>
  `,
})
export class NewTermDialogComponent {
  readonly open = model<boolean>(false);
  readonly created = output<Term>();

  private readonly terms = inject(TERM_REPOSITORY);

  protected readonly headerIcon = LucideCalendarPlus;
  protected readonly alertIcon = LucideCircleAlert;
  protected readonly notes = ['Se crea como PLANEADO.', 'Podrás activarlo posteriormente.'];

  protected readonly form = new FormGroup({
    start: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    end: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  private readonly values = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private readonly submitted = signal(false);

  private readonly start = computed(() => this.values().start ?? '');
  private readonly end = computed(() => this.values().end ?? '');
  protected readonly name = computed(() => termNameFromRange(this.start(), this.end()));
  protected readonly startLong = computed(() => (this.start() ? formatLongDate(this.start()) : ''));
  protected readonly endLong = computed(() => (this.end() ? formatLongDate(this.end()) : ''));
  protected readonly startShort = computed(() => (this.start() ? formatShortDate(this.start()) : ''));
  protected readonly endShort = computed(() => (this.end() ? formatShortDate(this.end()) : ''));
  protected readonly startWeekday = computed(() => (this.start() ? weekdayName(this.start()) : ''));
  protected readonly endWeekday = computed(() => (this.end() ? weekdayName(this.end()) : ''));
  protected readonly duration = computed(() =>
    this.start() && this.end() && this.end() > this.start()
      ? `${weeksOf(this.start(), this.end())} semanas · ${inclusiveDays(this.start(), this.end())} días`
      : '',
  );

  protected readonly startError = computed(() => (this.submitted() && !this.start() ? 'Selecciona la fecha de inicio.' : ''));
  protected readonly endError = computed(() => {
    if (!this.submitted()) return '';
    if (!this.end()) return 'Selecciona la fecha de fin.';
    return this.start() && this.end() <= this.start() ? 'La fecha de fin debe ser posterior al inicio.' : '';
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        untracked(() => {
          this.form.reset({ start: '', end: '' });
          this.submitting.set(false);
          this.serverError.set(null);
          this.submitted.set(false);
        });
      }
    });
  }

  protected openPicker(event: Event): void {
    try {
      (event.target as HTMLInputElement).showPicker?.();
    } catch {
      /* el navegador no permite abrirlo desde este gesto */
    }
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.submitted.set(true);
    const { start, end } = this.form.getRawValue();
    if (!start || !end || end <= start) return;
    const name = termNameFromRange(start, end);
    if (name.length > TERM_NAME_MAX) return;
    this.submitting.set(true);
    this.serverError.set(null);
    this.terms.create({ name, start_date: start, end_date: end }).subscribe({
      next: (term) => {
        this.submitting.set(false);
        this.open.set(false);
        this.created.emit(term);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.serverError.set(
          error instanceof ApiError && error.code === 'term_name_taken'
            ? `Ya existe un periodo llamado «${name}». Elige otras fechas.`
            : error instanceof ApiError && error.code === 'invalid_dates'
              ? 'La fecha de fin debe ser posterior al inicio.'
              : 'No fue posible crear el periodo. Inténtalo de nuevo.',
        );
      },
    });
  }
}
