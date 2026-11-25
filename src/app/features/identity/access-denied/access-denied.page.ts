import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideShieldAlert } from '@lucide/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { AUTH_PATHS, homePathFor } from '../../../core/auth/role-routing';
import { SessionStore } from '../../../core/auth/session.store';
import { AuthLayoutComponent } from '../../../layouts/auth/auth-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

/**
 * Acceso denegado (SIN diseño en Figma, Fase 2). Se muestra cuando la persona intenta abrir una sección
 * de otro rol, o cuando su cuenta no tiene interfaz disponible (p. ej. solo ADMIN, pospuesta).
 */
@Component({
  selector: 'edu-access-denied-page',
  imports: [RouterLink, AuthLayoutComponent, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <edu-auth-layout>
      <section class="flex flex-col items-center gap-6 rounded-card border border-border bg-surface px-6 py-8 text-center shadow-card sm:px-8">
        <span class="flex size-16 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
          <edu-icon [name]="shieldIcon" [size]="32" />
        </span>
        <header class="flex flex-col gap-2">
          <h1 class="m-0 text-[24px] font-bold leading-[normal] text-ink lg:text-[28px]">Acceso denegado</h1>
          <p class="m-0 text-[14px] leading-5 text-muted">{{ message() }}</p>
        </header>
        <div class="flex w-full flex-col gap-3">
          <a eduButton [routerLink]="primaryLink().path">{{ primaryLink().label }}</a>
          @if (loggedIn()) {
            <button eduButton variant="secondary" type="button" [disabled]="auth.signingOut()" (click)="auth.signOut()">
              Cerrar sesión
            </button>
          }
        </div>
      </section>
    </edu-auth-layout>
  `,
})
export class AccessDeniedPage {
  /** Query param `motivo` (component input binding). */
  readonly motivo = input<string | undefined>();

  protected readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);
  protected readonly shieldIcon = LucideShieldAlert;

  protected readonly loggedIn = computed(() => this.session.isAuthenticated());

  protected readonly message = computed(() =>
    this.motivo() === 'sin-interfaz'
      ? 'Tu cuenta no tiene una interfaz disponible todavía. Contacta a un administrador.'
      : 'No tienes permiso para ver esta sección. Si crees que es un error, contacta a un administrador.',
  );

  protected readonly primaryLink = computed(() => {
    const role = this.session.primaryRole();
    if (this.session.isAuthenticated() && role) return { path: homePathFor(role), label: 'Ir a mi inicio' };
    return { path: AUTH_PATHS.login, label: 'Ir al inicio de sesión' };
  });
}
