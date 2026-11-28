import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, model, signal, untracked } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { MONTHS_LONG, parseIsoDate, toIsoDate } from '../../utils/date-utils';
import { IconComponent } from '../icon/icon.component';
import { SelectComponent } from './select-field.component';

interface Cell {
  readonly iso: string;
  readonly day: number;
  readonly inMonth: boolean;
}

const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Calendario de rango (Figma "Modal nuevo periodo" 72:886): selectores de mes y año, flechas, semana que empieza en
 * lunes, inicio relleno en `primary` y días del rango resaltados en `success-bg`.
 * Primer clic = inicio; segundo clic posterior = fin; un clic anterior al inicio lo reemplaza. Teclado: flechas
 * mueven el foco por días (±1 / ±7), RePág/AvPág cambian de mes, Enter/Espacio selecciona.
 */
@Component({
  selector: 'edu-range-calendar',
  imports: [IconComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block rounded-panel border border-border bg-surface p-3' },
  template: `
    <div class="mb-3 flex items-center gap-2">
      <edu-select class="min-w-0 flex-1" ariaLabel="Mes" [options]="monthOptions" [value]="'' + month()" (valueChange)="setMonth(+$event)" />
      <edu-select class="w-[92px] shrink-0" ariaLabel="Año" [options]="yearOptions()" [value]="'' + year()" (valueChange)="setYear(+$event)" />
      <button type="button" class="flex size-9 shrink-0 items-center justify-center rounded-button border border-border text-ink hover:bg-canvas" aria-label="Mes anterior" (click)="shift(-1)"><edu-icon [name]="prev" [size]="16" /></button>
      <button type="button" class="flex size-9 shrink-0 items-center justify-center rounded-button border border-border text-ink hover:bg-canvas" aria-label="Mes siguiente" (click)="shift(1)"><edu-icon [name]="next" [size]="16" /></button>
    </div>
    <div role="grid" [attr.aria-label]="monthLabel()" (keydown)="onKeydown($event)">
      <div role="row" class="grid grid-cols-7 pb-1 text-center text-[12px] font-semibold leading-[normal] text-muted">
        @for (d of week; track $index) {
          <span role="columnheader" aria-hidden="true">{{ d }}</span>
        }
      </div>
      @for (row of rows(); track $index) {
        <div role="row" class="grid grid-cols-7 gap-y-1">
          @for (cell of row; track cell.iso) {
            <button
              type="button"
              role="gridcell"
              class="mx-auto flex size-8 items-center justify-center rounded-full text-[13px] leading-[normal]"
              [class]="cellClass(cell)"
              [attr.data-iso]="cell.iso"
              [attr.tabindex]="cell.iso === focusIso() ? 0 : -1"
              [attr.aria-selected]="isStart(cell) || isEnd(cell)"
              [attr.aria-label]="cell.iso"
              (click)="pick(cell)"
            >{{ cell.day }}</button>
          }
        </div>
      }
    </div>
  `,
})
export class RangeCalendarComponent {
  /** `YYYY-MM-DD` o vacío. */
  readonly start = model<string>('');
  readonly end = model<string>('');
  /** Años mostrados en el selector (alrededor del año actual). */
  readonly yearSpan = input<number>(6);

  protected readonly week = WEEK;
  protected readonly prev = LucideChevronLeft;
  protected readonly next = LucideChevronRight;
  protected readonly monthOptions = MONTHS_LONG.map((label, i) => ({ value: String(i), label }));

  private readonly today = new Date();
  protected readonly year = signal(this.today.getFullYear());
  protected readonly month = signal(this.today.getMonth());
  protected readonly focusIso = signal(toIsoDate(this.today));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Al elegir inicio desde fuera (p. ej. un selector de fecha nativo), el calendario muestra ese mes.
    effect(() => {
      const d = parseIsoDate(this.start());
      if (d) {
        untracked(() => {
          this.year.set(d.getFullYear());
          this.month.set(d.getMonth());
        });
      }
    });
  }

  protected readonly monthLabel = computed(() => `${MONTHS_LONG[this.month()]} ${this.year()}`);
  protected readonly yearOptions = computed(() => {
    const base = this.today.getFullYear();
    const from = Math.min(base - 1, this.year());
    const to = Math.max(base + this.yearSpan(), this.year());
    return Array.from({ length: to - from + 1 }, (_, i) => ({ value: String(from + i), label: String(from + i) }));
  });

  /** Semanas (lunes a domingo) que cubren el mes visible, con días de meses vecinos atenuados. */
  protected readonly rows = computed<Cell[][]>(() => {
    const first = new Date(this.year(), this.month(), 1);
    const offset = (first.getDay() + 6) % 7; // lunes = 0
    const cursor = new Date(this.year(), this.month(), 1 - offset);
    const rows: Cell[][] = [];
    for (let r = 0; r < 6; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < 7; c++) {
        row.push({ iso: toIsoDate(cursor), day: cursor.getDate(), inMonth: cursor.getMonth() === this.month() });
        cursor.setDate(cursor.getDate() + 1);
      }
      rows.push(row);
      if (cursor.getMonth() !== this.month() && r >= 3) break;
    }
    return rows;
  });

  protected isStart(cell: Cell): boolean {
    return cell.iso === this.start();
  }

  protected isEnd(cell: Cell): boolean {
    return cell.iso === this.end();
  }

  protected cellClass(cell: Cell): string {
    if (this.isStart(cell) || this.isEnd(cell)) return 'bg-primary font-bold text-white';
    const s = this.start();
    const e = this.end();
    if (s && e && cell.iso > s && cell.iso < e) return 'bg-success-bg text-success-fg font-medium';
    return cell.inMonth ? 'text-ink hover:bg-canvas' : 'text-muted/60 hover:bg-canvas';
  }

  protected pick(cell: Cell): void {
    this.focusIso.set(cell.iso);
    const s = this.start();
    if (!s || this.end() || cell.iso < s) {
      this.start.set(cell.iso);
      this.end.set('');
    } else if (cell.iso === s) {
      return;
    } else {
      this.end.set(cell.iso);
    }
    const d = parseIsoDate(cell.iso);
    if (d && (d.getMonth() !== this.month() || d.getFullYear() !== this.year())) {
      this.month.set(d.getMonth());
      this.year.set(d.getFullYear());
    }
  }

  protected setMonth(value: number): void {
    this.month.set(value);
  }

  protected setYear(value: number): void {
    this.year.set(value);
  }

  protected shift(delta: number): void {
    const d = new Date(this.year(), this.month() + delta, 1);
    this.year.set(d.getFullYear());
    this.month.set(d.getMonth());
  }

  protected onKeydown(event: KeyboardEvent): void {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const current = parseIsoDate(this.focusIso()) ?? new Date(this.year(), this.month(), 1);
    let next: Date | null = null;
    if (event.key in steps) {
      next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + steps[event.key]);
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      next = new Date(current.getFullYear(), current.getMonth() + (event.key === 'PageUp' ? -1 : 1), current.getDate());
    }
    if (!next) return;
    event.preventDefault();
    this.focusIso.set(toIsoDate(next));
    this.month.set(next.getMonth());
    this.year.set(next.getFullYear());
    // El foco se aplica tras renderizar el mes destino.
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`[data-iso="${toIsoDate(next as Date)}"]`)?.focus());
  }
}
