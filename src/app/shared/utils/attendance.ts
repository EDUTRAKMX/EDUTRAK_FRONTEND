/** Redondeo a 2 decimales (mitad hacia arriba), como los porcentajes del backend. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Porcentaje de asistencia ajustada por justificantes (regla del backend):
 * (presente + retardo) / (presente + retardo + falta). Los justificados salen del denominador;
 * sin denominador devuelve `null` (nunca 0 %).
 */
export function attendancePct(present: number, late: number, absent: number): number | null {
  const den = present + late + absent;
  return den === 0 ? null : round2(((present + late) / den) * 100);
}
