import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LucideCircleAlert, LucideUserPlus } from '@lucide/angular';
import { ApiError } from '../../../core/data/api-error';
import { DIRECTORY_REPOSITORY } from '../../../core/data/directory.repository';
import { GROUP_REPOSITORY } from '../../../core/data/group.repository';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { FieldComponent } from '../../../shared/components/form/field.component';
import { SelectComponent, SelectOption } from '../../../shared/components/form/select-field.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Enrollment, Person } from '../../../shared/models/academic.model';
import { fullName } from './groups.vm';

/**
 * Inscribir alumno (`POST /api/academic/groups/{id}/enrollments {student_id}`). SIN frame en Figma (el botón existe en
 * 83:5496 / 183:7336): construido con el mismo diálogo y campos de la Fase 3. Errores: 409 `already_enrolled`,
 * 409 `term_closed`, 422 `invalid_student`. DISCREPANCIA: el contrato no lista usuarios; los alumnos salen del directorio mock.
 */
@Component({
  selector: 'edu-enroll-student-dialog',
  imports: [ButtonComponent, DialogComponent, FieldComponent, IconComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-dialog [(open)]="open" title="Inscribir alumno" [subtitle]="'Agrega un alumno al grupo ' + groupCode() + '.'" [icon]="headerIcon" [dismissable]="!submitting()">
      <form id="enroll-form" class="flex flex-col gap-4" (submit)="$event.preventDefault(); submit()" novalidate>
        @if (serverError(); as message) {
          <p class="m-0 flex items-start gap-2 rounded-panel bg-danger-bg px-4 py-3 text-[13px] leading-5 text-danger-fg" role="alert">
            <edu-icon [name]="alertIcon" [size]="18" class="mt-px" />{{ message }}
          </p>
        }
        <edu-field for="enroll-student" label="Alumno" [required]="true" [error]="error()" [hint]="options().length ? null : 'No hay alumnos disponibles para inscribir.'">
          <edu-select
            selectId="enroll-student"
            class="[&_select]:h-11 [&_select]:text-[14px]"
            placeholder="Selecciona un alumno"
            [options]="options()"
            [invalid]="!!error()"
            [describedBy]="error() ? 'enroll-student-error' : null"
            [value]="form.controls.student.value"
            (valueChange)="form.controls.student.setValue($event)"
          />
        </edu-field>
      </form>
      <div slot="footer" class="flex flex-col-reverse gap-2 lg:flex-row lg:gap-3">
        <button eduButton variant="secondary" type="button" [disabled]="submitting()" (click)="open.set(false)">Cancelar</button>
        <button eduButton type="submit" form="enroll-form" [disabled]="submitting()" [attr.aria-busy]="submitting()">{{ submitting() ? 'Inscribiendo…' : 'Inscribir alumno' }}</button>
      </div>
    </edu-dialog>
  `,
})
export class EnrollStudentDialogComponent {
  readonly open = model<boolean>(false);
  readonly groupId = input.required<string>();
  readonly groupCode = input.required<string>();
  /** Ids de alumnos con inscripción ACTIVA en el grupo (se excluyen de la lista). */
  readonly enrolledIds = input<readonly string[]>([]);
  readonly enrolled = output<Enrollment>();

  private readonly directory = inject(DIRECTORY_REPOSITORY);
  private readonly groups = inject(GROUP_REPOSITORY);

  protected readonly headerIcon = LucideUserPlus;
  protected readonly alertIcon = LucideCircleAlert;
  protected readonly form = new FormGroup({ student: new FormControl('', { nonNullable: true, validators: [Validators.required] }) });
  private readonly students = signal<readonly Person[]>([]);
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private readonly submitted = signal(false);
  private readonly selected = signal('');

  protected readonly options = computed<SelectOption[]>(() => {
    const taken = new Set(this.enrolledIds());
    return this.students()
      .filter((s) => !taken.has(s.id))
      .map((s) => ({ value: s.id, label: `${fullName(s)} · ${s.institutional_number}` }));
  });
  protected readonly error = computed(() => (this.submitted() && !this.selected() ? 'Selecciona un alumno.' : null));

  constructor() {
    this.form.controls.student.valueChanges.subscribe((v) => this.selected.set(v));
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.form.reset({ student: '' });
        this.selected.set('');
        this.submitted.set(false);
        this.submitting.set(false);
        this.serverError.set(null);
        this.directory.students().subscribe((s) => this.students.set(s));
      });
    });
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.submitted.set(true);
    const student = this.form.controls.student.value;
    if (!student) return;
    this.submitting.set(true);
    this.serverError.set(null);
    this.groups.enroll(this.groupId(), student).subscribe({
      next: (enrollment) => {
        this.submitting.set(false);
        this.open.set(false);
        this.enrolled.emit(enrollment);
      },
      error: (e: unknown) => {
        this.submitting.set(false);
        const code = e instanceof ApiError ? e.code : '';
        this.serverError.set(
          code === 'already_enrolled'
            ? 'El alumno ya está inscrito en este grupo.'
            : code === 'term_closed'
              ? 'El periodo del grupo está cerrado.'
              : code === 'invalid_student'
                ? 'La persona seleccionada no es un alumno activo.'
                : 'No fue posible inscribir al alumno. Inténtalo de nuevo.',
        );
      },
    });
  }
}
