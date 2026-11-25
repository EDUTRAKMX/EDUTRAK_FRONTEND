import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideEye, LucideEyeOff, LucideIconInput } from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';

/**
 * Campo de texto o contraseña con etiqueta, icono inicial, pista y error accesibles.
 * Sin referencia en Figma (Fase 2): construido con tokens existentes (radio 8, borde `border`, texto `ink`).
 * Con `type="password"` añade el botón mostrar/ocultar. El control es un `FormControl` de Angular.
 */
@Component({
  selector: 'edu-input-field',
  imports: [ReactiveFormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-[6px]' },
  template: `
    <label [for]="inputId()" class="text-[13px] font-semibold leading-5 text-ink">{{ label() }}</label>
    <div
      class="flex h-11 items-center gap-2 rounded-button border bg-surface px-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
      [class]="error() ? 'border-danger-fg' : 'border-border hover:border-muted'"
    >
      @if (icon(); as leading) {
        <edu-icon [name]="leading" [size]="18" class="text-muted" />
      }
      <input
        [id]="inputId()"
        [formControl]="control()"
        [type]="inputType()"
        [attr.autocomplete]="autocomplete()"
        [attr.inputmode]="inputmode()"
        [attr.placeholder]="placeholder()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        autocapitalize="none"
        spellcheck="false"
        class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] text-ink outline-none placeholder:text-muted focus-visible:outline-none"
      />
      @if (type() === 'password') {
        <button
          type="button"
          class="flex size-8 shrink-0 items-center justify-center rounded-control text-muted hover:text-ink"
          [attr.aria-label]="visible() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          [attr.aria-pressed]="visible()"
          (click)="visible.set(!visible())"
        >
          <edu-icon [name]="visible() ? hideIcon : showIcon" [size]="18" />
        </button>
      }
    </div>
    @if (error(); as message) {
      <p [id]="inputId() + '-error'" class="m-0 text-[12px] leading-4 text-danger-fg" role="alert">{{ message }}</p>
    } @else if (hint(); as help) {
      <p [id]="inputId() + '-hint'" class="m-0 text-[12px] leading-4 text-muted">{{ help }}</p>
    }
  `,
})
export class InputFieldComponent {
  readonly control = input.required<FormControl<string>>();
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'password'>('text');
  readonly icon = input<LucideIconInput | null>(null);
  readonly autocomplete = input<string | null>(null);
  readonly inputmode = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly hint = input<string | null>(null);
  /** Mensaje de error ya resuelto por la pantalla (null = sin error). */
  readonly error = input<string | null>(null);

  protected readonly visible = signal(false);
  protected readonly showIcon = LucideEye;
  protected readonly hideIcon = LucideEyeOff;

  protected readonly inputType = computed(() => (this.type() === 'password' && this.visible() ? 'text' : this.type()));
  protected readonly describedBy = computed(() => {
    if (this.error()) return `${this.inputId()}-error`;
    return this.hint() ? `${this.inputId()}-hint` : null;
  });
}
