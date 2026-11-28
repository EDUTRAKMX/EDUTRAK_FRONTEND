import { ScheduleDetail } from '../../../shared/models/academic.model';

/** Días del backend: 1 = lunes … 7 = domingo. */
export const DAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const DAY_LONG = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

export function toMinutes(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

export function fromMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** "17:00" → "5:00 pm" (chip de materias del Resumen, Figma 78:4528). */
export function time12(time: string): string {
  const h = Number(time.slice(0, 2));
  return `${h % 12 === 0 ? 12 : h % 12}:${time.slice(3, 5)} ${h < 12 ? 'am' : 'pm'}`;
}

/** "17:00–18:40". */
export function rangeLabel(start: string, end: string): string {
  return `${start}–${end}`;
}

/** "Lun 5:00 pm" para la primera franja del día más temprano. */
export function firstSlotChip(slots: readonly Pick<ScheduleDetail, 'day_of_week' | 'start_time'>[]): string | null {
  const first = [...slots].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))[0];
  return first ? `${DAY_SHORT[first.day_of_week - 1]} ${time12(first.start_time)}` : null;
}

/** "3 h 20 min" a partir de minutos. */
export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Día del backend (1–7) de una fecha. */
export function dayOfWeekOf(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}
