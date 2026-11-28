import { ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideCalendarPlus, LucideCircleAlert } from '@lucide/angular';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { FieldComponent } from '../../../shared/components/form/field.component';
import { SelectComponent, SelectOption } from '../../../shared/components/form/select-field.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DAY_LONG, toMinutes } from './schedule-utils';

export interface AddClassRequest {
  readonly assignmentId: string;
  readonly day: number;
  readonly start: number;
  readonly end: number;
}

/**
 * Añadir clase. Móvil: Figma 325:239 (Clase + INICIO/FIN). En escritorio sirve también como alternativa por teclado al
 * arrastre. Se añade el campo Día (el backend exige `day_of_week`). "Receso" del diseño NO es un dato del backend (es
 * configuración de jornada) y no se ofrece. La pantalla valida choques y controla `error`/`busy`; el diálogo se cierra
 * cuando la pantalla lo cierra tras un alta correcta.
 */
@Component({
  selector: 'edu-add-class-dialog',
  imports: [ReactiveFormsModule, ButtonComponent, DialogComponent, FieldComponent, IconComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-dialog [(open)]="open" title="Añadir clase" subtitle="Agrega una franja al horario del grupo." [icon]="headerIcon" [dismissable]="!busy()">
      <form id="add-class-form" class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (localError() || error(); as message) {
          <p class="m-0 flex items-start gap-2 rounded-panel bg-danger-bg px-4 py-3 text-[13px] leading-5 text-danger-fg" role="alert"><edu-icon [name]="alertIcon" [size]="18" class="mt-px" />{{ message }}</p>
        }
        <edu-field for="class-assignment" label="Clase" [required]="true">
          <edu-select selectId="class-assignment" class="[&_select]:h-11 [&_select]:text-[14px]" placeholder="Selecciona una materia" [options]="assignmentOptions()" [value]="form.controls.assignment.value" (valueChange)="form.controls.assignment.setValue($event)" />
        </edu-field>
        <edu-field for="class-day" label="Día" [required]="true">
          <edu-select selectId="class-day" class="[&_select]:h-11 [&_select]:text-[14px]" [options]="dayOptions" [value]="form.controls.day.value" (valueChange)="form.controls.day.setValue($event)" />
        </edu-field>
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1 rounded-panel border border-border bg-surface px-4 py-3">
            <span class="text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">Inicio</span>
            <input type="time" class="border-0 bg-transparent p-0 text-[20px] font-bold text-ink outline-none" aria-label="Hora de inicio" [formControl]="form.controls.start" />
          </label>
          <label class="flex flex-col gap-1 rounded-panel border border-border bg-surface px-4 py-3">
            <span class="text-[12px] font-semibold uppercase tracking-[0.5px] text-muted">Fin</span>
            <input type="time" class="border-0 bg-transparent p-0 text-[20px] font-bold text-ink outline-none" aria-label="Hora de fin" [formControl]="form.controls.end" />
          </label>
        </div>
      </form>
      <div slot="footer" class="flex flex-col-reverse gap-2 lg:flex-row lg:gap-3">
        <button eduButton variant="secondary" type="button" [disabled]="busy()" (click)="open.set(false)">Cancelar</button>
        <button eduButton type="submit" form="add-class-form" [disabled]="busy()" [attr.aria-busy]="busy()">{{ busy() ? 'Añadiendo…' : 'Añadir' }}</button>
      </div>
    </edu-dialog>
  `,
})
export class AddClassDialogComponent {
  readonly open = model<boolean>(false);
  readonly assignments = input.required<readonly { id: string; label: string }[]>();
  readonly defaultStart = input<string>('17:00');
  readonly defaultEnd = input<string>('18:40');
  readonly error = input<string | null>(null);
  readonly busy = input<boolean>(false);
  readonly submitted = output<AddClassRequest>();

  protected readonly headerIcon = LucideCalendarPlus;
  protected readonly alertIcon = LucideCircleAlert;
  protected readonly dayOptions: SelectOption[] = DAY_LONG.slice(0, 5).map((label, i) => ({ value: String(i + 1), label }));
  protected readonly form = new FormGroup({
    assignment: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    day: new FormControl('1', { nonNullable: true }),
    start: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    end: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly assignmentOptions = computed<SelectOption[]>(() => this.assignments().map((a) => ({ value: a.id, label: a.label })));
  protected readonly localError = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.open()) {
        untracked(() => {
          this.form.reset({ assignment: '', day: '1', start: this.defaultStart(), end: this.defaultEnd() });
          this.localError.set(null);
        });
      }
    });
  }

  protected submit(): void {
    if (this.busy()) return;
    const v = this.form.getRawValue();
    if (!v.assignment || !v.start || !v.end) {
      this.localError.set('Completa la clase y las horas de inicio y fin.');
      return;
    }
    if (toMinutes(v.start) >= toMinutes(v.end)) {
      this.localError.set('La hora de inicio debe ser anterior a la de fin.');
      return;
    }
    this.localError.set(null);
    this.submitted.emit({ assignmentId: v.assignment, day: Number(v.day), start: toMinutes(v.start), end: toMinutes(v.end) });
  }
}
