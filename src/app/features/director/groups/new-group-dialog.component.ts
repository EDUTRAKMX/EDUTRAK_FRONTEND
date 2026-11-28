import { ChangeDetectionStrategy, Component, computed, effect, inject, model, output, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideCircleAlert, LucideUsers } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../../core/data/api-error';
import { CATALOG_REPOSITORY } from '../../../core/data/catalog.repository';
import { DIRECTORY_REPOSITORY } from '../../../core/data/directory.repository';
import { GROUP_REPOSITORY } from '../../../core/data/group.repository';
import { TERM_REPOSITORY } from '../../../core/data/term.repository';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { FieldComponent } from '../../../shared/components/form/field.component';
import { SelectComponent, SelectOption } from '../../../shared/components/form/select-field.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Career, Group, Person, Term } from '../../../shared/models/academic.model';
import { fullName } from './groups.vm';

const CODE_MAX = 20;
const INPUT =
  'h-11 w-full rounded-button border bg-surface px-3 text-[14px] text-ink placeholder:text-muted hover:border-muted';

/**
 * Nuevo grupo. Escritorio: Figma 83:5148 (modal). Móvil: Figma 183:12006 (bottom sheet).
 * Backend `POST /api/academic/groups {academic_term_id, career_id, code, level, tutor_id?}`: carrera activa, periodo no
 * cerrado, código único por periodo (se guarda en mayúsculas), tutor opcional.
 *
 * DISCREPANCIAS: (1) Figma marca "Tutor inicial *" como obligatorio; el backend lo permite vacío (y la lista ofrece
 * "Asignar tutor"), así que aquí es opcional. (2) El sheet móvil trae campos de otro flujo (Lista de alumnos, Horario,
 * Sección) que la creación de grupos no admite: se usan los campos del modal de escritorio en ambas versiones.
 * (3) Figma no pide carrera: se usa la única carrera activa del catálogo.
 */
@Component({
  selector: 'edu-new-group-dialog',
  imports: [ReactiveFormsModule, ButtonComponent, DialogComponent, FieldComponent, IconComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-dialog [(open)]="open" title="Nuevo grupo" subtitle="Ingresa los datos del grupo para registrarlo." [icon]="headerIcon" [dismissable]="!submitting()">
      <form id="new-group-form" class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (serverError(); as message) {
          <p class="m-0 flex items-start gap-2 rounded-panel bg-danger-bg px-4 py-3 text-[13px] leading-5 text-danger-fg" role="alert">
            <edu-icon [name]="alertIcon" [size]="18" class="mt-px" />{{ message }}
          </p>
        }
        <edu-field for="group-term" label="Periodo académico" [required]="true" [error]="err('term')">
          <edu-select selectId="group-term" class="[&_select]:h-11 [&_select]:text-[14px]" [options]="termOptions()" placeholder="Selecciona un periodo" [invalid]="!!err('term')" [describedBy]="err('term') ? 'group-term-error' : null" [value]="form.controls.term.value" (valueChange)="form.controls.term.setValue($event)" />
        </edu-field>
        <edu-field for="group-code" label="Código del grupo" [required]="true" [error]="err('code')">
          <input id="group-code" type="text" autocomplete="off" placeholder="Ej. 5A" [class]="input(!!err('code'))" [formControl]="form.controls.code" [attr.aria-invalid]="err('code') ? 'true' : null" [attr.aria-describedby]="err('code') ? 'group-code-error' : null" />
        </edu-field>
        <edu-field for="group-level" label="Cuatrimestre / nivel" [required]="true" [error]="err('level')">
          <input id="group-level" type="number" min="1" step="1" inputmode="numeric" placeholder="Ej. 5" [class]="input(!!err('level'))" [formControl]="form.controls.level" [attr.aria-invalid]="err('level') ? 'true' : null" [attr.aria-describedby]="err('level') ? 'group-level-error' : null" />
        </edu-field>
        <edu-field for="group-tutor" label="Tutor inicial" hint="Opcional: puedes asignarlo después.">
          <edu-select selectId="group-tutor" class="[&_select]:h-11 [&_select]:text-[14px]" [options]="tutorOptions()" placeholder="Sin tutor" [value]="form.controls.tutor.value" (valueChange)="form.controls.tutor.setValue($event)" />
        </edu-field>
      </form>
      <div slot="footer" class="flex flex-col-reverse gap-2 lg:flex-row lg:gap-3">
        <button eduButton variant="secondary" type="button" [disabled]="submitting()" (click)="open.set(false)">Cancelar</button>
        <button eduButton type="submit" form="new-group-form" [disabled]="submitting() || loading()" [attr.aria-busy]="submitting()">
          {{ submitting() ? 'Creando…' : 'Crear grupo' }}
        </button>
      </div>
    </edu-dialog>
  `,
})
export class NewGroupDialogComponent {
  readonly open = model<boolean>(false);
  /** Periodo preseleccionado (p. ej. el filtro actual de la lista). */
  readonly defaultTermId = model<string>('');
  readonly created = output<Group>();

  private readonly termsRepo = inject(TERM_REPOSITORY);
  private readonly catalog = inject(CATALOG_REPOSITORY);
  private readonly directory = inject(DIRECTORY_REPOSITORY);
  private readonly groups = inject(GROUP_REPOSITORY);

  protected readonly headerIcon = LucideUsers;
  protected readonly alertIcon = LucideCircleAlert;
  protected readonly form = new FormGroup({
    term: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(CODE_MAX)] }),
    level: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[1-9]\d*$/)] }),
    tutor: new FormControl('', { nonNullable: true }),
  });
  private readonly terms = signal<readonly Term[]>([]);
  private readonly tutors = signal<readonly Person[]>([]);
  private career: Career | null = null;
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private readonly submitted = signal(false);

  /** Solo periodos que admiten grupos nuevos (no cerrados). */
  protected readonly termOptions = computed<SelectOption[]>(() =>
    this.terms().filter((t) => t.status !== 'closed').map((t) => ({ value: t.id, label: t.name })),
  );
  protected readonly tutorOptions = computed<SelectOption[]>(() => this.tutors().map((t) => ({ value: t.id, label: fullName(t) })));

  constructor() {
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.form.reset({ term: this.defaultTermId(), code: '', level: '', tutor: '' });
        this.submitted.set(false);
        this.submitting.set(false);
        this.serverError.set(null);
        this.loading.set(true);
        forkJoin({ terms: this.termsRepo.list(), tutors: this.directory.tutors(), careers: this.catalog.careers() }).subscribe(
          ({ terms, tutors, careers }) => {
            this.terms.set(terms);
            this.tutors.set(tutors);
            this.career = careers.find((c) => c.is_active) ?? null;
            const open = terms.filter((t) => t.status !== 'closed');
            if (!open.some((t) => t.id === this.form.controls.term.value)) {
              this.form.controls.term.setValue((open.find((t) => t.status === 'active') ?? open[0])?.id ?? '');
            }
            this.loading.set(false);
          },
        );
      });
    });
  }

  protected input(invalid: boolean): string {
    return `${INPUT} ${invalid ? 'border-danger-fg' : 'border-border'}`;
  }

  protected err(name: 'term' | 'code' | 'level'): string | null {
    if (!this.submitted()) return null;
    const c = this.form.controls[name];
    if (c.valid) return null;
    if (name === 'term') return 'Selecciona un periodo.';
    if (name === 'code') return c.hasError('maxlength') ? `El código admite hasta ${CODE_MAX} caracteres.` : 'Ingresa el código del grupo.';
    return c.hasError('required') ? 'Ingresa el cuatrimestre o nivel.' : 'Debe ser un entero positivo.';
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (!this.career) {
      this.serverError.set('No hay una carrera activa en el catálogo.');
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.serverError.set(null);
    this.groups
      .create({ academic_term_id: v.term, career_id: this.career.id, code: v.code.trim(), level: Number(v.level), tutor_id: v.tutor || null })
      .subscribe({
        next: (group) => {
          this.submitting.set(false);
          this.open.set(false);
          this.created.emit(group);
        },
        error: (e: unknown) => {
          this.submitting.set(false);
          const code = e instanceof ApiError ? e.code : '';
          this.serverError.set(
            code === 'group_code_taken'
              ? `Ya existe un grupo «${v.code.trim().toUpperCase()}» en ese periodo.`
              : code === 'term_closed'
                ? 'El periodo seleccionado está cerrado.'
                : code === 'invalid_tutor'
                  ? 'La persona seleccionada no es un tutor activo.'
                  : 'No fue posible crear el grupo. Inténtalo de nuevo.',
          );
        },
      });
  }
}
