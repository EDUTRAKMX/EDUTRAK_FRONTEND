import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UiRole } from '../../core/auth/role.model';
import { ROLE_NAVIGATION } from '../../core/navigation/nav.config';
import { IconComponent } from '../../shared/components/icon/icon.component';

/**
 * Sidebar de escritorio (Figma 134:5466 y equivalentes por rol): 252px, logo en 65px,
 * grupos con título, ítems de 36px y separadores de 1px. El estado colapsado (solo iconos)
 * NO está en los frames consultados: es una adaptación provisoria (ver docs).
 */
@Component({
  selector: 'edu-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex h-full flex-col border-r border-border bg-surface transition-[width] duration-200',
    '[class.w-sidebar]': '!collapsed()',
    '[class.w-sidebar-collapsed]': 'collapsed()',
  },
  template: `
    <div class="flex h-[65px] shrink-0 items-center border-b border-border px-4 py-[10px]">
      <div class="flex h-10 items-center gap-2">
        <span class="size-8 shrink-0 rounded-button bg-secondary" aria-hidden="true"></span>
        @if (!collapsed()) {
          <div class="flex w-[156px] flex-col justify-center whitespace-nowrap">
            <p class="m-0 text-[16px] font-semibold leading-[18px] tracking-[-0.3125px] text-primary">EDUTRAK</p>
            <p class="m-0 text-[9px] font-light leading-[normal] text-secondary">Universidad Tecnológica de Torreón</p>
          </div>
        }
      </div>
    </div>

    <nav class="flex flex-1 flex-col gap-4 overflow-y-auto" [class]="collapsed() ? 'p-3' : 'p-6'" aria-label="Navegación principal">
      @for (group of nav().desktop; track group.title; let first = $first) {
        @if (!first) {
          <div class="h-px w-full shrink-0 bg-divider"></div>
        }
        <div class="flex flex-col gap-2">
          @if (!collapsed()) {
            <p class="m-0 text-[12px] font-bold leading-[18px] text-ink">{{ group.title }}</p>
          }
          <ul class="m-0 flex list-none flex-col gap-1 p-0">
            @for (item of group.items; track item.path) {
              <li>
                <a
                  #link="routerLinkActive"
                  routerLinkActive
                  [routerLink]="[nav().basePath, item.path]"
                  [attr.title]="collapsed() ? item.label : null"
                  [attr.aria-current]="link.isActive ? 'page' : null"
                  class="relative flex h-9 items-center rounded-control text-[13px] font-medium leading-5"
                  [class]="itemClass(link.isActive)"
                >
                  @if (link.isActive) {
                    <span class="absolute left-1 top-2 h-5 w-[3px] rounded-[3px] bg-primary" aria-hidden="true"></span>
                  }
                  <edu-icon [name]="item.icon" [size]="16" />
                  @if (!collapsed()) {
                    <span class="ml-[3px] whitespace-nowrap">{{ item.label }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </nav>
  `,
})
export class SidebarComponent {
  readonly role = input.required<UiRole>();
  readonly collapsed = input<boolean>(false);

  protected readonly nav = computed(() => ROLE_NAVIGATION[this.role()]);

  protected itemClass(active: boolean): string {
    const base = this.collapsed() ? 'justify-center px-0' : active ? 'px-4' : 'px-3';
    return `${base} ${active ? 'bg-canvas text-ink' : 'text-muted hover:bg-canvas'}`;
  }
}
