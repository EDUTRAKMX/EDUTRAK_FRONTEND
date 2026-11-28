import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Interruptor "Solo con alertas" (Figma 72:3849 / 183:6738). `role="switch"` con `aria-checked`. */
@Component({
  selector: 'edu-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <button
      type="button"
      role="switch"
      class="relative h-5 w-9 shrink-0 rounded-full transition-colors"
      [class]="checked() ? 'bg-primary' : 'bg-border'"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="label()"
      (click)="checked.set(!checked())"
    >
      <span class="absolute left-[2px] top-[2px] size-4 rounded-full bg-surface shadow-dot transition-transform" [class.translate-x-4]="checked()"></span>
    </button>
    <span class="text-[13px] leading-[normal] text-ink" aria-hidden="true">{{ label() }}</span>
  `,
})
export class SwitchComponent {
  readonly checked = model<boolean>(false);
  readonly label = input.required<string>();
}
