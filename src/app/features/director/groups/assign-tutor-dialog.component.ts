import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideCircleAlert, LucideUserPlus } from '@lucide/angular';
import { ApiError } from '../../../core/data/api-error';
import { DIRECTORY_REPOSITORY } from '../../../core/data/directory.repository';
import { GROUP_REPOSITORY } from '../../../core/data/group.repository';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { FieldComponent } from '../../../shared/components/form/field.component';
import { SelectComponent, SelectOption } from '../../../shared/components/form/select-field.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Group, Person } from '../../../shared/models/academic.model';
import { fullName } from './groups.vm';

const NONE = '__none__';

/**
 * Asignar / cambiar tutor. Escritorio: Figma 83:5427 (modal 587px). Móvil: Figma 183:12054 (bottom sheet).
 * Backend: `PUT /api/academic/groups/{id}/tutor {tutor_id}`; `null` quita el tutor; el tutor anterior pierde el acceso
 * al instante. Errores: 422 `invalid_tutor`, 409 `term_closed`.
 * DISCREPANCIA: el contrato no tiene listado de usuarios; la lista de tutores sale del directorio mock.
 */
@Component({
  selector: 'edu-assign-tutor-dialog',
  imports: [ReactiveFormsModule, BadgeComponent, ButtonComponent, DialogComponent, FieldComponent, IconComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-dialog [(open)]="open" title="Asignar/Cambiar tutor" subtitle="Asigna el tutor para el grupo" [icon]="headerIcon" [dismissable]="!submitting()">
      <form id="assign-tutor-form" class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <p class="m-0 text-[15px] leading-6 text-muted">El tutor tendrá acceso al seguimiento académico de los alumnos del grupo.</p>
        <div>
          <edu-badge [tone]="currentTutorId() ? 'success' : 'warning'" class="!px-3 !py-[5px] !text-[12px]">
            Tutor actual: {{ currentTutorName() ?? 'Sin asignar' }}
          </edu-badge>
        </div>
        @if (serverError(); as message) {
          <p class="m-0 flex items-start gap-2 rounded-panel bg-danger-bg px-4 py-3 text-[13px] leading-5 text-danger-fg" role="alert">
            <edu-icon [name]="alertIcon" [size]="18" class="mt-px" />{{ message }}
          </p>
        }
        <edu-field for="assign-tutor" label="Buscar tutor" [required]="true" [error]="error()">
          <edu-select
            selectId="assign-tutor"
            [options]="options()"
            placeholder="Selecciona un tutor"
            [invalid]="!!error()"
            [describedBy]="error() ? 'assign-tutor-error' : null"
            [value]="form.controls.tutor.value"
            (valueChange)="form.controls.tutor.setValue($event)"
            class="[&_select]:h-11 [&_select]:text-[14px]"
          />
        </edu-field>
      </form>
      <div slot="footer" class="flex flex-col-reverse gap-2 lg:flex-row lg:gap-3">
        <button eduButton variant="secondary" type="button" [disabled]="submitting()" (click)="open.set(false)">Cancelar</button>
        <button eduButton type="submit" form="assign-tutor-form" [disabled]="submitting()" [attr.aria-busy]="submitting()">
          {{ submitting() ? 'Asignando…' : 'Asignar tutor' }}
        </button>
      </div>
    </edu-dialog>
  `,
})
export class AssignTutorDialogComponent {
  readonly open = model<boolean>(false);
  readonly groupId = input.required<string>();
  readonly currentTutorId = input<string | null>(null);
  readonly currentTutorName = input<string | null>(null);
  readonly assigned = output<Group>();

  private readonly directory = inject(DIRECTORY_REPOSITORY);
  private readonly groups = inject(GROUP_REPOSITORY);

  protected readonly headerIcon = LucideUserPlus;
  protected readonly alertIcon = LucideCircleAlert;
  protected readonly form = new FormGroup({ tutor: new FormControl('', { nonNullable: true, validators: [Validators.required] }) });
  private readonly tutors = signal<readonly Person[]>([]);
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private readonly submitted = signal(false);
  private readonly selected = signal('');

  protected readonly options = computed<SelectOption[]>(() => {
    const list = this.tutors().map((t) => ({ value: t.id, label: fullName(t) }));
    return this.currentTutorId() ? [...list, { value: NONE, label: 'Sin tutor (quitar el actual)' }] : list;
  });
  protected readonly error = computed(() => {
    if (!this.submitted()) return null;
    if (!this.selected()) return 'Selecciona un tutor.';
    if (this.selected() === this.currentTutorId()) return 'Selecciona un tutor distinto del actual.';
    return null;
  });

  constructor() {
    this.form.controls.tutor.valueChanges.subscribe((v) => this.selected.set(v));
    effect(() => {
      if (this.open()) {
        untracked(() => {
          this.form.reset({ tutor: '' });
          this.selected.set('');
          this.submitted.set(false);
          this.submitting.set(false);
          this.serverError.set(null);
          this.directory.tutors().subscribe((t) => this.tutors.set(t));
        });
      }
    });
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.submitted.set(true);
    const value = this.form.controls.tutor.value;
    if (!value || value === this.currentTutorId()) return;
    this.submitting.set(true);
    this.serverError.set(null);
    this.groups.setTutor(this.groupId(), value === NONE ? null : value).subscribe({
      next: (group) => {
        this.submitting.set(false);
        this.open.set(false);
        this.assigned.emit(group);
      },
      error: (e: unknown) => {
        this.submitting.set(false);
        this.serverError.set(
          e instanceof ApiError && e.code === 'term_closed'
            ? 'El periodo del grupo está cerrado: ya no admite cambios.'
            : e instanceof ApiError && e.code === 'invalid_tutor'
              ? 'La persona seleccionada no es un tutor activo.'
              : 'No fue posible asignar el tutor. Inténtalo de nuevo.',
        );
      },
    });
  }
}
