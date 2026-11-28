import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LucideBookPlus, LucideCircleAlert } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../../core/data/api-error';
import { CATALOG_REPOSITORY } from '../../../core/data/catalog.repository';
import { DIRECTORY_REPOSITORY } from '../../../core/data/directory.repository';
import { GROUP_REPOSITORY } from '../../../core/data/group.repository';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { FieldComponent } from '../../../shared/components/form/field.component';
import { SelectComponent, SelectOption } from '../../../shared/components/form/select-field.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CurriculumEntry, Person, TeachingAssignment } from '../../../shared/models/academic.model';
import { fullName } from '../groups/groups.vm';

/**
 * Agregar materia al grupo ("Agregar materia" de Figma 83:6588, sin frame propio): crea una asignación docente
 * (`POST /api/academic/groups/{id}/teaching-assignments {subject_id, teacher_id}`). La materia debe estar en el currículo
 * de la carrera para el nivel del grupo y no repetirse (409 `teaching_assignment_exists`).
 */
@Component({
  selector: 'edu-add-subject-dialog',
  imports: [ButtonComponent, DialogComponent, FieldComponent, IconComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-dialog [(open)]="open" title="Agregar materia" subtitle="Asigna una materia del plan de estudios y su profesor." [icon]="headerIcon" [dismissable]="!submitting()">
      <form id="add-subject-form" class="flex flex-col gap-4" (submit)="$event.preventDefault(); submit()" novalidate>
        @if (serverError(); as message) {
          <p class="m-0 flex items-start gap-2 rounded-panel bg-danger-bg px-4 py-3 text-[13px] leading-5 text-danger-fg" role="alert"><edu-icon [name]="alertIcon" [size]="18" class="mt-px" />{{ message }}</p>
        }
        <edu-field for="subject-pick" label="Materia" [required]="true" [error]="err('subject')" [hint]="subjectOptions().length ? null : 'Todas las materias del nivel ya están asignadas.'">
          <edu-select selectId="subject-pick" class="[&_select]:h-11 [&_select]:text-[14px]" placeholder="Selecciona una materia" [options]="subjectOptions()" [invalid]="!!err('subject')" [describedBy]="err('subject') ? 'subject-pick-error' : null" [value]="form.controls.subject.value" (valueChange)="form.controls.subject.setValue($event)" />
        </edu-field>
        <edu-field for="teacher-pick" label="Profesor" [required]="true" [error]="err('teacher')">
          <edu-select selectId="teacher-pick" class="[&_select]:h-11 [&_select]:text-[14px]" placeholder="Selecciona un profesor" [options]="teacherOptions()" [invalid]="!!err('teacher')" [describedBy]="err('teacher') ? 'teacher-pick-error' : null" [value]="form.controls.teacher.value" (valueChange)="form.controls.teacher.setValue($event)" />
        </edu-field>
      </form>
      <div slot="footer" class="flex flex-col-reverse gap-2 lg:flex-row lg:gap-3">
        <button eduButton variant="secondary" type="button" [disabled]="submitting()" (click)="open.set(false)">Cancelar</button>
        <button eduButton type="submit" form="add-subject-form" [disabled]="submitting()" [attr.aria-busy]="submitting()">{{ submitting() ? 'Agregando…' : 'Agregar materia' }}</button>
      </div>
    </edu-dialog>
  `,
})
export class AddSubjectDialogComponent {
  readonly open = model<boolean>(false);
  readonly groupId = input.required<string>();
  readonly careerId = input.required<string>();
  readonly level = input.required<number>();
  readonly assignedSubjectIds = input<readonly string[]>([]);
  readonly created = output<TeachingAssignment>();

  private readonly catalog = inject(CATALOG_REPOSITORY);
  private readonly directory = inject(DIRECTORY_REPOSITORY);
  private readonly groups = inject(GROUP_REPOSITORY);

  protected readonly headerIcon = LucideBookPlus;
  protected readonly alertIcon = LucideCircleAlert;
  protected readonly form = new FormGroup({
    subject: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    teacher: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  private readonly curriculum = signal<readonly CurriculumEntry[]>([]);
  private readonly teachers = signal<readonly Person[]>([]);
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private readonly submitted = signal(false);
  private readonly values = signal({ subject: '', teacher: '' });

  protected readonly subjectOptions = computed<SelectOption[]>(() => {
    const taken = new Set(this.assignedSubjectIds());
    return this.curriculum().filter((c) => !taken.has(c.subject_id)).map((c) => ({ value: c.subject_id, label: c.subject_name }));
  });
  protected readonly teacherOptions = computed<SelectOption[]>(() => this.teachers().map((t) => ({ value: t.id, label: fullName(t) })));

  constructor() {
    this.form.valueChanges.subscribe(() => this.values.set(this.form.getRawValue()));
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.form.reset({ subject: '', teacher: '' });
        this.values.set({ subject: '', teacher: '' });
        this.submitted.set(false);
        this.submitting.set(false);
        this.serverError.set(null);
        forkJoin({ c: this.catalog.curriculum(this.careerId(), this.level()), t: this.directory.teachers() }).subscribe(({ c, t }) => {
          this.curriculum.set(c);
          this.teachers.set(t);
        });
      });
    });
  }

  protected err(name: 'subject' | 'teacher'): string | null {
    if (!this.submitted() || this.values()[name]) return null;
    return name === 'subject' ? 'Selecciona una materia.' : 'Selecciona un profesor.';
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.submitted.set(true);
    const v = this.form.getRawValue();
    if (!v.subject || !v.teacher) return;
    this.submitting.set(true);
    this.serverError.set(null);
    this.groups.createAssignment(this.groupId(), { subject_id: v.subject, teacher_id: v.teacher }).subscribe({
      next: (a) => {
        this.submitting.set(false);
        this.open.set(false);
        this.created.emit(a);
      },
      error: (e: unknown) => {
        this.submitting.set(false);
        const code = e instanceof ApiError ? e.code : '';
        this.serverError.set(
          code === 'teaching_assignment_exists'
            ? 'Esa materia ya está asignada al grupo.'
            : code === 'subject_not_in_curriculum'
              ? 'La materia no pertenece al plan de estudios de este nivel.'
              : code === 'term_closed'
                ? 'El periodo del grupo está cerrado.'
                : 'No fue posible agregar la materia. Inténtalo de nuevo.',
        );
      },
    });
  }
}
