import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideCircleAlert, LucideIdCard, LucideInfo, LucideKeyRound, LucideLoaderCircle } from '@lucide/angular';
import { DEMO_ACCOUNT_HINTS, DemoAccountHint } from '../../../core/auth/auth.api';
import { AuthService } from '../../../core/auth/auth.service';
import { institutionalNumberValidator } from '../../../core/auth/auth.validators';
import { postLoginUrl } from '../../../core/auth/role-routing';
import { AuthLayoutComponent } from '../../../layouts/auth/auth-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputFieldComponent } from '../../../shared/components/form/input-field.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { loginErrorMessage } from '../auth-messages';

/**
 * Inicio de sesión. SIN diseño en Figma: construido en la Fase 2 con el sistema visual existente.
 * El identificador es el número institucional de 8 dígitos (`LoginRequest.institutional_number`).
 * El rol NO se elige aquí: lo determina la respuesta del servicio de autenticación.
 */
@Component({
  selector: 'edu-login-page',
  imports: [ReactiveFormsModule, AuthLayoutComponent, ButtonComponent, InputFieldComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-auth-layout>
      <section class="flex flex-col gap-6 rounded-card border border-border bg-surface px-6 py-8 shadow-card sm:px-8">
        <header class="flex flex-col gap-1">
          <h1 class="m-0 text-[24px] font-bold leading-[normal] text-ink lg:text-[28px]">Iniciar sesión</h1>
          <p class="m-0 text-[13px] leading-5 text-muted">Accede con tu número institucional y tu contraseña.</p>
        </header>

        @if (reason() === 'expirada') {
          <p class="m-0 flex items-start gap-2 rounded-panel bg-info-bg px-4 py-3 text-[13px] leading-5 text-info-fg" role="status">
            <edu-icon [name]="infoIcon" [size]="18" class="mt-px" />
            Tu sesión expiró. Inicia sesión de nuevo para continuar.
          </p>
        }
        @if (serverError(); as message) {
          <p class="m-0 flex items-start gap-2 rounded-panel bg-danger-bg px-4 py-3 text-[13px] leading-5 text-danger-fg" role="alert">
            <edu-icon [name]="alertIcon" [size]="18" class="mt-px" />
            {{ message }}
          </p>
        }

        <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()" novalidate #formEl>
          <edu-input-field
            inputId="institutional_number"
            label="Número institucional"
            [control]="form.controls.institutional_number"
            [icon]="idIcon"
            autocomplete="username"
            inputmode="numeric"
            placeholder="8 dígitos"
            [error]="numberError()"
          />
          <edu-input-field
            inputId="password"
            label="Contraseña"
            type="password"
            [control]="form.controls.password"
            [icon]="keyIcon"
            autocomplete="current-password"
            [error]="passwordError()"
          />
          <button eduButton type="submit" [disabled]="submitting()" [attr.aria-busy]="submitting()">
            @if (submitting()) {
              <edu-icon [name]="spinnerIcon" [size]="20" class="animate-spin" />
              Iniciando sesión…
            } @else {
              Iniciar sesión
            }
          </button>
        </form>

        <p class="m-0 text-[12px] leading-4 text-muted">
          ¿Problemas para acceder? Solicita a un administrador que restablezca tu contraseña.
        </p>
      </section>

      @if (demoAccounts.length) {
        <details class="rounded-panel border border-dashed border-border bg-surface px-4 py-3">
          <summary class="cursor-pointer text-[13px] font-semibold leading-5 text-ink">
            Cuentas de demostración
            <span class="ml-1 rounded-full bg-warning-bg px-2 py-[2px] text-[10px] font-semibold text-warning-fg">Solo demo</span>
          </summary>
          <ul class="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            @for (account of demoAccounts; track account.institutionalNumber) {
              <li class="flex items-center justify-between gap-3 text-[12px] leading-4">
                <span class="flex min-w-0 flex-col">
                  <span class="font-semibold text-ink">{{ account.label }}</span>
                  <span class="text-muted">{{ account.institutionalNumber }}</span>
                  @if (account.note) {
                    <span class="text-warning-fg">{{ account.note }}</span>
                  }
                </span>
                <button
                  type="button"
                  class="shrink-0 rounded-control border border-border px-3 py-[6px] text-[12px] font-semibold text-ink hover:bg-canvas"
                  (click)="fill(account)"
                >
                  Usar
                </button>
              </li>
            }
          </ul>
          <p class="m-0 mt-3 text-[11px] leading-4 text-muted">
            Cuentas ficticias. Los datos de acceso están en docs/MOCK_DATA_ARCHITECTURE.md.
          </p>
        </details>
      }
    </edu-auth-layout>
  `,
})
export class LoginPage {
  /** Query params enlazados por `withComponentInputBinding`. */
  readonly returnUrl = input<string | undefined>();
  readonly motivo = input<string | undefined>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly demoAccounts: readonly DemoAccountHint[] = inject(DEMO_ACCOUNT_HINTS);

  protected readonly form = new FormGroup({
    institutional_number: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, institutionalNumberValidator()],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly idIcon = LucideIdCard;
  protected readonly keyIcon = LucideKeyRound;
  protected readonly infoIcon = LucideInfo;
  protected readonly alertIcon = LucideCircleAlert;
  protected readonly spinnerIcon = LucideLoaderCircle;

  protected reason(): string | undefined {
    return this.motivo();
  }

  protected numberError(): string | null {
    const control = this.form.controls.institutional_number;
    if (!control.touched) return null;
    if (control.hasError('required')) return 'Ingresa tu número institucional.';
    if (control.hasError('institutionalNumber')) return 'El número institucional tiene 8 dígitos.';
    return null;
  }

  protected passwordError(): string | null {
    const control = this.form.controls.password;
    return control.touched && control.hasError('required') ? 'Ingresa tu contraseña.' : null;
  }

  protected fill(account: DemoAccountHint): void {
    this.form.setValue({ institutional_number: account.institutionalNumber, password: account.password });
    this.serverError.set(null);
  }

  protected submit(): void {
    if (this.submitting()) return; // evita envíos duplicados (Enter repetido, doble clic)
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      // Tras el siguiente render, cuando `aria-invalid` ya está aplicado.
      afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('input[aria-invalid="true"]')?.focus(), { injector: this.injector });
      return;
    }
    this.submitting.set(true);
    this.serverError.set(null);
    const { institutional_number, password } = this.form.getRawValue();
    this.auth.login({ institutional_number: institutional_number.trim(), password }).subscribe({
      next: (user) => {
        void this.router.navigateByUrl(postLoginUrl(user, this.returnUrl(), this.router)).then(() => this.submitting.set(false));
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.serverError.set(loginErrorMessage(error));
        this.form.controls.password.reset('');
        afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('#password')?.focus(), { injector: this.injector });
      },
    });
  }
}
