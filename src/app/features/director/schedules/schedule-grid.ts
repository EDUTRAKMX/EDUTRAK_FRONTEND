import { ScheduleDetail } from '../../../shared/models/academic.model';
import { toMinutes } from './schedule-utils';

/**
 * Configuración de la jornada (Figma 83:6588 "Jornada e intervalos"). Es estado de la interfaz: el backend NO guarda
 * jornadas ni descansos, solo franjas (`day_of_week`, `start_time`, `end_time`). Los minutos son desde las 00:00.
 */
export interface ScheduleConfig {
  readonly start: number;
  readonly end: number;
  /** Duración de un módulo de clase. */
  readonly classMin: number;
  readonly breakMin: number;
  /** Inicio del descanso por día (lunes a viernes). */
  readonly breakStart: readonly number[];
}

export const WEEK_DAYS = 5;

export function defaultConfig(): ScheduleConfig {
  const start = 17 * 60;
  const classMin = 50;
  const breakStart = start + 2 * classMin; // 18:40 (Figma)
  return { start, end: 21 * 60 + 30, classMin, breakMin: 20, breakStart: Array(WEEK_DAYS).fill(breakStart) };
}

/** Descanso del día (índice 0 = lunes). */
export function breakOf(config: ScheduleConfig, dayIndex: number): { start: number; end: number } {
  const start = config.breakStart[dayIndex] ?? config.breakStart[0];
  return { start, end: start + config.breakMin };
}

/** Inicios de módulo del día: antes del descanso desde `start`, y después desde el fin del descanso. */
export function moduleStarts(config: ScheduleConfig, dayIndex: number): number[] {
  const brk = breakOf(config, dayIndex);
  const out: number[] = [];
  for (let t = config.start; t + config.classMin <= brk.start; t += config.classMin) out.push(t);
  for (let t = brk.end; t + config.classMin <= config.end; t += config.classMin) out.push(t);
  return out;
}

/** Ajusta un minuto cualquiera al inicio de módulo más cercano hacia atrás (o al primero). */
export function snapToModule(config: ScheduleConfig, dayIndex: number, minute: number): number | null {
  const starts = moduleStarts(config, dayIndex);
  if (starts.length === 0) return null;
  let best = starts[0];
  for (const s of starts) if (s <= minute) best = s;
  return best;
}

export type PlacementError =
  | 'outside_hours'
  | 'break_overlap'
  | 'group_overlap'
  | 'teacher_overlap'
  | 'assignment_overlap';

export interface PlacementRequest {
  readonly config: ScheduleConfig;
  /** 1 = lunes … 5 = viernes. */
  readonly day: number;
  readonly start: number;
  readonly duration: number;
  readonly assignmentId: string;
  readonly teacherId: string;
  readonly groupId: string;
  /** Todas las franjas existentes con su asignación (para detectar choques de grupo y de docente). */
  readonly slots: readonly (ScheduleDetail & { readonly teacher_id: string })[];
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean => aStart < bEnd && bStart < aEnd;

/**
 * Valida una colocación. Reglas del backend: sin solape dentro de la MISMA asignación (`assignment_overlap`).
 * Reglas de la interfaz (más estrictas, para evitar horarios incompatibles): dentro de la jornada, sin pisar el
 * descanso, sin dos materias a la vez en el mismo grupo y sin que un docente esté en dos grupos a la vez.
 */
export function validatePlacement(req: PlacementRequest): PlacementError | null {
  const end = req.start + req.duration;
  if (req.start < req.config.start || end > req.config.end) return 'outside_hours';
  const brk = breakOf(req.config, req.day - 1);
  if (overlaps(req.start, end, brk.start, brk.end)) return 'break_overlap';
  for (const slot of req.slots) {
    if (slot.day_of_week !== req.day) continue;
    if (!overlaps(req.start, end, toMinutes(slot.start_time), toMinutes(slot.end_time))) continue;
    if (slot.teaching_assignment_id === req.assignmentId) return 'assignment_overlap';
    if (slot.group_id === req.groupId) return 'group_overlap';
    if (slot.teacher_id === req.teacherId) return 'teacher_overlap';
  }
  return null;
}

export const PLACEMENT_MESSAGE: Readonly<Record<PlacementError, string>> = {
  outside_hours: 'La clase queda fuera de la jornada configurada.',
  break_overlap: 'La clase se empalma con el descanso de ese día.',
  group_overlap: 'El grupo ya tiene otra materia en ese horario.',
  teacher_overlap: 'El docente ya imparte clase a otro grupo en ese horario.',
  assignment_overlap: 'Esa materia ya tiene una clase en ese horario.',
};

/** Minutos que una materia ya tiene colocados en la semana. */
export function placedMinutes(slots: readonly ScheduleDetail[], assignmentId: string): number {
  return slots
    .filter((s) => s.teaching_assignment_id === assignmentId)
    .reduce((sum, s) => sum + toMinutes(s.end_time) - toMinutes(s.start_time), 0);
}
