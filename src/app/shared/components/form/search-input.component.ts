import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { LucideSearch } from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';

/** Campo de búsqueda de las listas del Director (Figma 72:3849 / 69:960): 40px, icono de lupa y marcador de posición. */
@Component({
  selector: 'edu-search-input',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-10 min-w-0 items-center gap-2 rounded-button border border-border bg-surface px-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary' },
  template: `
    <edu-icon [name]="icon" [size]="16" class="text-muted" />
    <input
      type="search"
      class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-ink outline-none placeholder:text-muted focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      [attr.aria-label]="label()"
      [placeholder]="placeholder()"
      [value]="value()"
      (input)="value.set($any($event.target).value)"
    />
  `,
})
export class SearchInputComponent {
  readonly value = model<string>('');
  readonly placeholder = input<string>('Buscar…');
  readonly label = input<string>('Buscar');
  protected readonly icon = LucideSearch;
}
