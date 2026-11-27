import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Profile, buildProfile } from '../../core/auth/profile';
import { UiRole, isUiRole } from '../../core/auth/role.model';
import { SessionStore } from '../../core/auth/session.store';
import { TERM_REPOSITORY } from '../../core/data/term.repository';
import { MobileHeaderComponent } from './mobile-header.component';
import { MobileMenuComponent } from './mobile-menu.component';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

const PLACEHOLDER_PHOTO = '/images/avatar-placeholder.jpg';

/**
 * Layout principal por rol. Escritorio (≥1024px): sidebar + topbar. Móvil: cabecera con
 * hamburguesa y menú lateral. El rol llega por `data` de la ruta (component input binding).
 */
@Component({
  selector: 'edu-shell',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, MobileHeaderComponent, MobileMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded-button focus:bg-surface focus:px-3 focus:py-2"
      >Saltar al contenido</a
    >
    <div class="flex min-h-dvh bg-canvas">
      <div class="sticky top-0 hidden h-dvh shrink-0 lg:block">
        <edu-sidebar [role]="uiRole()" [collapsed]="collapsed()" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col">
        <edu-topbar
          class="sticky top-0 z-30 hidden lg:flex"
          [profile]="profile()"
          [periodLabel]="periodLabel()"
          [photoUrl]="desktopPhoto()"
          [collapsed]="collapsed()"
          (toggleSidebar)="collapsed.set(!collapsed())"
          (signOut)="auth.signOut()"
        />
        <edu-mobile-header
          class="sticky top-0 z-30 lg:hidden"
          [initial]="profile().initials.charAt(0)"
          [photoUrl]="photo"
          (openMenu)="menuOpen.set(true)"
        />
        <main id="main" class="min-w-0 flex-1 px-4 py-[22px] lg:px-5 lg:py-8">
          <router-outlet />
        </main>
      </div>
    </div>
    <edu-mobile-menu [role]="uiRole()" [profile]="profile()" [photoUrl]="photo" [(open)]="menuOpen" (signOut)="auth.signOut()" />
  `,
})
export class ShellLayout {
  /** Rol de la ruta (route data `role`). Un valor inválido cae a `alumno`. */
  readonly role = input<string>('alumno');

  private readonly session = inject(SessionStore);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly terms = inject(TERM_REPOSITORY);

  protected readonly photo = PLACEHOLDER_PHOTO;
  protected readonly collapsed = signal(false);
  protected readonly menuOpen = signal(false);

  protected readonly uiRole = computed<UiRole>(() => {
    const value = this.role();
    return isUiRole(value) ? value : 'alumno';
  });

  /** Perfil de la sesión autenticada (los guards garantizan que existe al entrar en el shell). */
  protected readonly profile = computed<Profile>(() => {
    const role = this.uiRole();
    const user = this.session.user();
    return user ? buildProfile(user, role) : { fullName: '', roleLabel: '', initials: '?' };
  });

  /** En escritorio el Alumno muestra inicial; el resto, foto (así está en Figma). */
  protected readonly desktopPhoto = computed(() => (this.uiRole() === 'alumno' ? null : this.photo));

  private readonly activeTerm = toSignal(this.terms.getActive(), { initialValue: null });
  protected readonly periodLabel = computed(() => {
    const term = this.activeTerm();
    return term ? `${term.name} · Activo` : null;
  });

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.menuOpen.set(false));
  }
}
