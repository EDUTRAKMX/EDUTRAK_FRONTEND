import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight, LucideChevronsLeft, LucideChevronsRight } from '@lucide/angular';
import { IconComponent } from '../icon/icon.component';

/**
 * Paginación (Figma 69:960 / 72:3849 / 83:5496 escritorio; 183:6517 móvil). Escritorio: "Mostrando X de Y {noun}",
 * « ‹ 1 2 3 › » y selector "por página". Móvil: texto centrado y solo ‹ 1 2 3 ›. La página actual va en `primary`.
 * `page` es base 1.
 */
@Component({
  selector: 'edu-pagination',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col items-center gap-3 px-4 py-4 lg:flex-row lg:justify-between lg:px-[15px]' },
  template: `
    <p class="m-0 text-[13px] leading-[normal] text-ink lg:text-[12px]" role="status">Mostrando {{ shown() }} de {{ total() }} {{ noun() }}</p>
    <nav class="flex items-center gap-[6px]" [attr.aria-label]="'Paginación de ' + noun()">
      <button type="button" class="hidden size-7 items-center justify-center rounded-control text-primary disabled:opacity-40 lg:flex" aria-label="Primera página" [disabled]="page() <= 1" (click)="go(1)"><edu-icon [name]="first" [size]="16" /></button>
      <button type="button" class="flex size-7 items-center justify-center rounded-control text-primary disabled:opacity-40" aria-label="Página anterior" [disabled]="page() <= 1" (click)="go(page() - 1)"><edu-icon [name]="prev" [size]="16" /></button>
      @for (p of pages(); track p) {
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-control text-[13px] leading-[normal]"
          [class]="p === page() ? 'font-bold text-primary' : 'text-ink hover:bg-canvas'"
          [attr.aria-current]="p === page() ? 'page' : null"
          [attr.aria-label]="'Página ' + p"
          (click)="go(p)"
        >{{ p }}</button>
      }
      <button type="button" class="flex size-7 items-center justify-center rounded-control text-primary disabled:opacity-40" aria-label="Página siguiente" [disabled]="page() >= pageCount()" (click)="go(page() + 1)"><edu-icon [name]="next" [size]="16" /></button>
      <button type="button" class="hidden size-7 items-center justify-center rounded-control text-primary disabled:opacity-40 lg:flex" aria-label="Última página" [disabled]="page() >= pageCount()" (click)="go(pageCount())"><edu-icon [name]="last" [size]="16" /></button>
    </nav>
    <label class="hidden items-center gap-2 text-[12px] text-ink lg:flex">
      <select
        class="h-7 cursor-pointer rounded-control border border-border bg-surface px-2 text-[12px] font-semibold text-primary"
        aria-label="Elementos por página"
        (change)="changeSize($event)"
      >
        @for (size of sizes(); track size) {
          <option [value]="size" [selected]="size === pageSize()">{{ size }}</option>
        }
      </select>
      por pagina
    </label>
  `,
})
export class PaginationComponent {
  readonly total = input.required<number>();
  readonly page = model<number>(1);
  readonly pageSize = model<number>(10);
  /** Elementos de la página actual (para "Mostrando X de Y"). */
  readonly shown = input.required<number>();
  readonly noun = input<string>('elementos');
  readonly sizes = input<readonly number[]>([10, 20, 50]);

  protected readonly first = LucideChevronsLeft;
  protected readonly prev = LucideChevronLeft;
  protected readonly next = LucideChevronRight;
  protected readonly last = LucideChevronsRight;

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  /** Hasta 5 números de página alrededor de la actual. */
  protected readonly pages = computed(() => {
    const count = this.pageCount();
    const start = Math.max(1, Math.min(this.page() - 2, count - 4));
    const end = Math.min(count, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  protected go(page: number): void {
    this.page.set(Math.min(this.pageCount(), Math.max(1, page)));
  }

  protected changeSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(1);
  }
}
