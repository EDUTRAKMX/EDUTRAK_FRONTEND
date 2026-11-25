import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideCircleAlert, LucideKeyRound, LucideLoaderCircle, LucideLockKeyhole } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  newPasswordValidator,
  passwordChangeGroupValidator,
} from '../../../core/auth/auth.validators';
import { postLoginUrl } from '../../../core/auth/role-routing';
import { SessionStore } from '../../../core/auth/session.store';
import { AuthLayoutComponent } from '../../../layouts/auth/auth-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputFieldComponent } from '../../../shared/components/form/input-field.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { changePasswordErrorMessage } from '../auth-messages';

/**
 * Cambio obligatorio de contraseña (`must_change_password`, PATCH /api/auth/password).
 * SIN diseño en Figma (Fase 2). Reglas del backend: actual requerida, nueva de 10 a 128 bytes y distinta de la actual.
 * La confirmación es solo validación de UX del cliente (el contrato no la envía).
 */
@Component({
  selector: 'edu-change-password-page',
  imports: [ReactiveFormsModule, AuthLayoutComponent, ButtonComponent, InputFieldComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-auth-layout>
      <section class="flex flex-col gap-6 rounded-card border border-border bg-surface px-6 py-8 shadow-card sm:px-8">
        <header class="flex flex-col gap-1">
          <h1 class="m-0 text-[24px] font-bold leading-[normal] text-ink lg:text-[28px]">Cambia tu contraseña</h1>
          <p class="m-0 text-[13px] leading-5 text-muted">
            Por seguridad, debes establecer una contraseña nueva antes de continuar.
          </p>
        </header>

        @if (serverError(); as message) {
          <p class="m-0 flex items-start gap-2 rounded-panel bg-danger-bg px-4 py-3 text-[13px] leading-5 text-danger-fg" role="alert">
            <edu-icon [name]="alertIcon" [size]="18" class="mt-px" />
            {{ message }}
          </p>
        }

        <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <edu-input-field
            inputId="current_password"
            label="Contraseña actual"
            type="password"
            [control]="form.controls.current_password"
            [icon]="keyIcon"
            autocomplete="current-password"
            [error]="currentError()"
          />
          <edu-input-field
            inputId="new_password"
            label="Nueva contraseña"
            type="password"
            [control]="form.controls.new_password"
            [icon]="lockIcon"
            autocomplete="new-password"
            [hint]="'Mínimo ' + minLength + ' caracteres y distinta de la actual.'"
            [error]="newError()"
          />
          <edu-input-field
            inputId="confirm_password"
            label="Confirmar nueva contraseña"
            type="password"
            [control]="form.controls.confirm_password"
            [icon]="lockIcon"
            autocomplete="new-password"
            [error]="confirmError()"
          />
          <button eduButton type="submit" [disabled]="submitting()" [attr.aria-busy]="submitting()">
            @if (submitting()) {
              <edu-icon [name]="spinnerIcon" [size]="20" class="animate-spin" />
              Guardando…
            } @else {
              Actualizar contraseña
            }
          </button>
          <button eduButton variant="secondary" type="button" [disabled]="submitting() || auth.signingOut()" (click)="auth.signOut()">
            Cerrar sesión
          </button>
        </form>
      </section>
    </edu-auth-layout>
  `,
})
export class ChangePasswordPage {
  protected readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly minLength = PASSWORD_MIN_LENGTH;

  protected readonly form = new FormGroup(
    {
      current_password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      new_password: new FormControl('', { nonNullable: true, validators: [Validators.required, newPasswordValidator()] }),
      confirm_password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [passwordChangeGroupValidator()] },
  );

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly keyIcon = LucideKeyRound;
  protected readonly lockIcon = LucideLockKeyhole;
  protected readonly alertIcon = LucideCircleAlert;
  protected readonly spinnerIcon = LucideLoaderCircle;

  protected currentError(): string | null {
    const control = this.form.controls.current_password;
    return control.touched && control.hasError('required') ? 'Ingresa tu contraseña actual.' : null;
  }

  protected newError(): string | null {
    const control = this.form.controls.new_password;
    if (!control.touched) return null;
    if (control.hasError('required')) return 'Ingresa la nueva contraseña.';
    if (control.hasError('tooShort')) return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    if (control.hasError('tooLong')) return `La contraseña no puede superar ${PASSWORD_MAX_BYTES} bytes.`;
    if (this.form.hasError('samePassword')) return 'La nueva contraseña debe ser distinta de la actual.';
    return null;
  }

  protected confirmError(): string | null {
    const control = this.form.controls.confirm_password;
    if (!control.touched) return null;
    if (control.hasError('required')) return 'Confirma la nueva contraseña.';
    if (this.form.hasError('mismatch')) return 'Las contraseñas no coinciden.';
    return null;
  }

  protected submit(): void {
    if (this.submitting()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      // Tras el siguiente render, cuando `aria-invalid` ya está aplicado.
      afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('input[aria-invalid="true"]')?.focus(), { injector: this.injector });
      return;
    }
    this.submitting.set(true);
    this.serverError.set(null);
    const { current_password, new_password } = this.form.getRawValue();
    this.auth.changePassword({ current_password, new_password }).subscribe({
      next: () => {
        this.toast.success('Contraseña actualizada', 'Ya puedes usar EDUTRAK.');
        const user = this.session.user();
        const target = user ? postLoginUrl(user, null, this.router) : '/login';
        void this.router.navigateByUrl(target).then(() => this.submitting.set(false));
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.serverError.set(changePasswordErrorMessage(error));
      },
    });
  }
}
