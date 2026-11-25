import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  viewChild,
  ElementRef,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideChevronRight, LucideX } from '@lucide/angular';
import { Profile } from '../../core/auth/profile';
import { UiRole } from '../../core/auth/role.model';
import { ROLE_NAVIGATION } from '../../core/navigation/nav.config';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

/**
 * Menú lateral móvil (Figma "Menú modal": 225:5196 Alumno, 225:4739 Profesor, 225:4956 Director,
 * 225:5381 Tutor). Panel de 312px (Alumno/Tutor) o 352px (Profesor/Director), cabecera de 64px,
 * identidad del rol y destinos de 56px. El fondo oscurecido no aparece en Figma: valor provisorio.
 */
@Component({
  selector: 'edu-mobile-menu',
  imports: [RouterLink, RouterLinkActive, IconComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'fixed inset-0 z-50 lg:hidden',
    '[class.pointer-events-none]': '!open()',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <div
      class="absolute inset-0 bg-ink/40 transition-opacity duration-200"
      [class.opacity-0]="!open()"
      (click)="close()"
      aria-hidden="true"
    ></div>
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menú principal"
      class="absolute inset-y-0 left-0 flex max-w-[calc(100vw-32px)] flex-col overflow-clip bg-surface transition-transform duration-200"
      [class.shadow-drawer]="open()"
      [class.-translate-x-full]="!open()"
      [attr.inert]="open() ? null : ''"
      [style.width.px]="nav().mobileMenuWidth"
    >
      <div class="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <p class="m-0 text-[20px] font-bold leading-[normal] text-ink">Menú</p>
        <button
          #closeButton
          type="button"
          class="flex size-9 items-center justify-center rounded-button bg-canvas text-muted"
          aria-label="Cerrar menú"
          (click)="close()"
        >
          <edu-icon [name]="closeIcon" [size]="22" />
        </button>
      </div>

      <div class="flex shrink-0 items-center gap-3 border-b border-border px-5 py-6">
        <edu-avatar [initials]="profile().initials.charAt(0)" [src]="photoUrl()" [size]="48" />
        <div class="flex min-w-0 flex-1 flex-col gap-1 overflow-clip">
          <p class="m-0 text-[18px] font-bold leading-6 text-ink">{{ nav().mobileRoleTitle }}</p>
          <p class="m-0 text-[12px] leading-[normal] text-muted">Menú principal</p>
        </div>
      </div>

      <nav class="flex flex-col gap-2 overflow-y-auto px-4 py-6" aria-label="Navegación principal">
        @for (item of nav().mobile; track item.path) {
          <a
            #link="routerLinkActive"
            routerLinkActive
            [routerLink]="[nav().basePath, item.path]"
            [attr.aria-current]="link.isActive ? 'page' : null"
            class="relative flex min-h-14 items-center gap-[14px] overflow-clip rounded-panel px-4 py-[14px] text-[15px] leading-[22px]"
            [class]="link.isActive ? 'bg-success-bg font-bold text-success-fg' : 'font-medium text-ink'"
            (click)="close()"
          >
            @if (link.isActive) {
              <span class="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-[2px] bg-primary" aria-hidden="true"></span>
            }
            <edu-icon [name]="item.icon" [size]="22" [class]="link.isActive ? 'text-success-fg' : 'text-muted'" />
            <span class="min-w-0 flex-1">{{ item.label }}</span>
            @if (link.isActive) {
              <edu-icon [name]="chevronIcon" [size]="16" />
            }
          </a>
        }
      </nav>
    </div>
  `,
})
export class MobileMenuComponent {
  readonly role = input.required<UiRole>();
  readonly profile = input.required<Profile>();
  readonly photoUrl = input<string | null>(null);
  readonly open = model<boolean>(false);

  protected readonly nav = computed(() => ROLE_NAVIGATION[this.role()]);
  protected readonly closeIcon = LucideX;
  protected readonly chevronIcon = LucideChevronRight;
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  constructor() {
    effect(() => {
      if (this.open()) {
        // Mueve el foco al panel al abrir (el panel pasa de inert a interactivo en este ciclo).
        queueMicrotask(() => this.closeButton()?.nativeElement.focus());
      }
    });
  }

  protected close(): void {
    if (this.open()) this.open.set(false);
  }
}
