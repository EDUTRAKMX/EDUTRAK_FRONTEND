import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideBell, LucideMenu } from '@lucide/angular';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

/** Cabecera móvil (Figma 183:11041): 64px, hamburguesa a la izquierda; campana y foto a la derecha. */
@Component({
  selector: 'edu-mobile-header',
  imports: [AvatarComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-5' },
  template: `
    <button
      type="button"
      class="flex size-8 items-center justify-center text-ink"
      aria-label="Abrir menú"
      aria-haspopup="dialog"
      (click)="openMenu.emit()"
    >
      <edu-icon [name]="menuIcon" [size]="24" />
    </button>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex size-8 items-center justify-center rounded-full bg-chip text-ink"
        aria-label="Notificaciones"
      >
        <edu-icon [name]="bellIcon" [size]="16" />
      </button>
      <edu-avatar [initials]="initial()" [src]="photoUrl()" [size]="32" [online]="true" />
    </div>
  `,
})
export class MobileHeaderComponent {
  readonly initial = input<string>('');
  readonly photoUrl = input<string | null>(null);
  readonly openMenu = output<void>();

  protected readonly menuIcon = LucideMenu;
  protected readonly bellIcon = LucideBell;
}
