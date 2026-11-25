import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideBell, LucideChevronDown, LucideChevronsLeft, LucideChevronsRight } from '@lucide/angular';
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
  host: { class: 'relative flex h-[65px] shrink-0 items-center justify-end gap-3 border-b border-border bg-surface p-4' },
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
      <div class="flex items-center gap-[6px]">
        <edu-avatar [initials]="profile().initials.charAt(0)" [src]="photoUrl()" [size]="32" [online]="true" />
        <div class="flex flex-col whitespace-nowrap">
          <p class="m-0 text-[12px] font-semibold leading-[18px] tracking-[-0.3125px] text-ink">{{ profile().fullName }}</p>
          <p class="m-0 text-[8px] leading-[normal] text-muted">{{ profile().roleLabel }}</p>
        </div>
        <edu-icon [name]="chevronIcon" [size]="16" />
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

  protected readonly bellIcon = LucideBell;
  protected readonly chevronIcon = LucideChevronDown;
  protected readonly collapseIcon = LucideChevronsLeft;
  protected readonly expandIcon = LucideChevronsRight;
}
