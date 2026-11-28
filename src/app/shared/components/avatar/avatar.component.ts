import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Avatar circular. Con `src` muestra foto; sin ella, la inicial sobre `success-bg`
 * (Figma "Profile photo", node 134:5658). `online` añade el punto de estado verde.
 */
@Component({
  selector: 'edu-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-block shrink-0', '[style.width.px]': 'size()', '[style.height.px]': 'size()' },
  template: `
    @if (src(); as photo) {
      <img [src]="photo" alt="" class="size-full rounded-full object-cover" />
    } @else {
      <span
        class="flex size-full items-center justify-center rounded-full bg-success-bg font-semibold text-success-fg"
        [style.font-size.px]="textSize() ?? fontSize()"
        >{{ initials() }}</span
      >
    }
    @if (online()) {
      <span
        class="absolute bottom-[6%] right-[6%] size-[8px] rounded-full border border-white bg-online shadow-dot"
      ></span>
    }
  `,
})
export class AvatarComponent {
  readonly initials = input<string>('');
  readonly src = input<string | null>(null);
  readonly size = input<number>(32);
  readonly online = input<boolean>(false);
  /** Tamaño de texto en px; por defecto la mitad del avatar (una inicial). Para dos iniciales usar ≈ 0.4 × tamaño. */
  readonly textSize = input<number | null>(null);

  protected readonly fontSize = computed(() => Math.round(this.size() / 2));
}
