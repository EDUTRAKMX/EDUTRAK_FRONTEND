import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { LucideBell, LucideChevronDown, LucideChevronsLeft, LucideChevronsRight, LucideLogOut } from '@lucide/angular';
import { Profile } from '../../core/auth/profile';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

/**
 * Topbar de escritorio (Figma 134:5649): 65px, píldora del periodo, divisor vertical,
 * campana, perfil y el tirador del sidebar (20px, `primary-light`) sobre el borde izquierdo.
 */
@Component({
  selector: 'edu-topbar',
  imports: [AvatarComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative flex h-[65px] shrink-0 items-center justify-end gap-3 border-b border-border bg-surface p-4',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeMenu(true)',
  },
  template: `
    <button
      type="button"
      class="absolute left-[-10px] top-[22px] flex size-5 items-center justify-center rounded-[10px] bg-primary-light p-[2px] text-white"
      [attr.aria-label]="collapsed() ? 'Expandir menú lateral' : 'Contraer menú lateral'"
      [attr.aria-expanded]="!collapsed()"
      (click)="toggleSidebar.emit()"
    >
      <edu-icon [name]="collapsed() ? expandIcon : collapseIcon" [size]="16" />
    </button>

    @if (periodLabel(); as period) {
      <span
        class="inline-flex items-start overflow-clip rounded-full bg-period-bg px-[9px] py-[5px] text-[11px] font-semibold leading-[normal] text-period-fg whitespace-nowrap"
        >{{ period }}</span
      >
    }
    <span class="h-full w-px shrink-0 bg-divider" aria-hidden="true"></span>

    <div class="flex items-center justify-end gap-2">
      <button
        type="button"
        class="flex size-8 items-center justify-center rounded-full bg-chip text-ink"
        aria-label="Notificaciones"
      >
        <edu-icon [name]="bellIcon" [size]="16" />
      </button>
      <div class="relative">
        <!-- Menú de usuario (Fase 2, sin diseño en Figma): el botón conserva el aspecto del bloque de perfil. -->
        <button
          #menuTrigger
          type="button"
          class="flex items-center gap-[6px] rounded-control text-left"
          aria-haspopup="true"
          aria-controls="user-menu"
          [attr.aria-expanded]="menuOpen()"
          (click)="menuOpen.set(!menuOpen())"
        >
          <edu-avatar [initials]="profile().initials.charAt(0)" [src]="photoUrl()" [size]="32" [online]="true" />
          <span class="flex flex-col whitespace-nowrap">
            <span class="text-[12px] font-semibold leading-[18px] tracking-[-0.3125px] text-ink">{{ profile().fullName }}</span>
            <span class="text-[8px] leading-[normal] text-muted">{{ profile().roleLabel }}</span>
          </span>
          <edu-icon [name]="chevronIcon" [size]="16" class="transition-transform" [class.rotate-180]="menuOpen()" />
        </button>
        @if (menuOpen()) {
          <div
            id="user-menu"
            class="absolute right-0 top-[calc(100%+12px)] z-40 flex w-60 flex-col gap-1 rounded-panel border border-border bg-surface p-2 shadow-card-lg"
          >
            <div class="flex flex-col px-3 py-2">
              <span class="text-[13px] font-semibold leading-5 text-ink">{{ profile().fullName }}</span>
              <span class="text-[11px] leading-4 text-muted">{{ profile().roleLabel }}</span>
            </div>
            <div class="h-px bg-divider" aria-hidden="true"></div>
            <button
              type="button"
              class="flex h-9 items-center gap-2 rounded-control px-3 text-[13px] font-medium leading-5 text-ink hover:bg-canvas"
              (click)="menuOpen.set(false); signOut.emit()"
            >
              <edu-icon [name]="logoutIcon" [size]="16" />
              Cerrar sesión
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class TopbarComponent {
  readonly profile = input.required<Profile>();
  readonly periodLabel = input<string | null>(null);
  readonly photoUrl = input<string | null>(null);
  readonly collapsed = input<boolean>(false);
  readonly toggleSidebar = output<void>();
  readonly signOut = output<void>();

  protected readonly menuOpen = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly bellIcon = LucideBell;
  protected readonly chevronIcon = LucideChevronDown;
  protected readonly collapseIcon = LucideChevronsLeft;
  protected readonly expandIcon = LucideChevronsRight;
  protected readonly logoutIcon = LucideLogOut;

  protected onDocumentClick(event: Event): void {
    if (this.menuOpen() && !this.host.nativeElement.contains(event.target as Node)) this.menuOpen.set(false);
  }

  /** Escape cierra el menú y devuelve el foco al botón de perfil. */
  protected closeMenu(restoreFocus: boolean): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    if (restoreFocus) this.host.nativeElement.querySelector<HTMLElement>('[aria-controls="user-menu"]')?.focus();
  }
}
