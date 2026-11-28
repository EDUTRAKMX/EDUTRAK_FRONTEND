import { AttendanceSummary, GradeCategory, GradesSummary } from '../../shared/models/analytics.model';
import { attendancePct, round2 } from '../../shared/utils/attendance';
import { SubjectEnrollmentFact } from './fixtures/academic.seed';

/** Categoría del backend: NA < 80, SA 80–89.99, DE 90–99.99, AU = 100. Nunca redondea antes de clasificar. */
export function categoryOf(score: number): GradeCategory {
  if (score < 80) return 'NA';
  if (score < 90) return 'SA';
  if (score < 100) return 'DE';
  return 'AU';
}

export function gradesSummary(facts: readonly SubjectEnrollmentFact[]): GradesSummary {
  let na = 0;
  let sa = 0;
  let de = 0;
  let au = 0;
  let total = 0;
  let graded = 0;
  for (const f of facts) {
    total += f.units_total;
    graded += f.scores.length;
    for (const score of f.scores) {
      const c = categoryOf(score);
      if (c === 'NA') na++;
      else if (c === 'SA') sa++;
      else if (c === 'DE') de++;
      else au++;
    }
  }
  return { units_total: total, units_graded: graded, units_pending: total - graded, na, sa, de, au };
}

/** Suma numeradores y denominadores de todos los hechos (nunca promedia porcentajes). */
export function attendanceSummary(facts: readonly SubjectEnrollmentFact[]): AttendanceSummary {
  let present = 0;
  let late = 0;
  let absent = 0;
  let justified = 0;
  for (const f of facts) {
    present += f.recent.present + f.previous.present;
    late += f.recent.late + f.previous.late;
    absent += f.recent.absent + f.previous.absent;
    justified += f.recent.justified + f.previous.justified;
  }
  return {
    closed_session_records: present + late + absent + justified,
    present,
    late,
    absent,
    justified,
    unjustified_absences: absent,
    attendance_pct: attendancePct(present, late, absent),
  };
}

/** Diferencia en puntos porcentuales entre las últimas 4 semanas y las 4 anteriores. */
export function attendanceDeltaPp(facts: readonly SubjectEnrollmentFact[]): number | null {
  const sum = (key: 'recent' | 'previous') => {
    let present = 0;
    let late = 0;
    let absent = 0;
    for (const f of facts) {
      present += f[key].present;
      late += f[key].late;
      absent += f[key].absent;
    }
    return attendancePct(present, late, absent);
  };
  const recent = sum('recent');
  const previous = sum('previous');
  return recent === null || previous === null ? null : round2(recent - previous);
}

/** Promedio de las calificaciones capturadas (SIN contrato en el backend) y variación entre las dos primeras unidades. */
export function averageScores(facts: readonly SubjectEnrollmentFact[]): { average: number | null; delta: number | null } {
  const all = facts.flatMap((f) => f.scores);
  const unit = (n: number) => facts.map((f) => f.scores[n]).filter((s): s is number => s !== undefined);
  const mean = (xs: readonly number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const average = mean(all);
  const first = mean(unit(0));
  const second = mean(unit(1));
  return {
    average: average === null ? null : round2(average),
    delta: first === null || second === null ? null : round2(second - first),
  };
}
