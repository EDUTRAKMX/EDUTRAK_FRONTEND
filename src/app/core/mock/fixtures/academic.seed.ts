import {
  Career,
  CurriculumEntry,
  Enrollment,
  Group,
  Person,
  Schedule,
  Subject,
  TeachingAssignment,
  Term,
} from '../../../shared/models/academic.model';
import { Alert, AlertRule } from '../../../shared/models/analytics.model';
import { MOCK_ACCOUNTS } from './users.fixture';

/*
 * Semilla ÚNICA de datos académicos ficticios. La consumen todos los repositorios mock (Director hoy;
 * Profesor, Tutor y Alumno después), de modo que un mismo alumno conserva nombre, matrícula, grupo,
 * calificaciones y asistencias en cualquier pantalla. Es determinista (PRNG con semilla fija) y
 * relacional por identificadores. Todos los nombres son inventados.
 *
 * Los componentes NO importan este archivo: lo hace solo `MockDatabase`.
 */

export interface AttendanceCounts {
  readonly present: number;
  readonly late: number;
  readonly absent: number;
  readonly justified: number;
}

/** Hechos por inscripción a materia (alumno × asignación): base de los indicadores de Analytics. */
export interface SubjectEnrollmentFact {
  readonly id: string;
  readonly student_id: string;
  readonly group_id: string;
  readonly teaching_assignment_id: string;
  /** Calificaciones de las unidades ya capturadas (0–100, 2 decimales). Las demás están pendientes. */
  readonly scores: readonly number[];
  readonly units_total: number;
  /** Asistencia de las últimas 4 semanas y de las 4 anteriores (solo sesiones cerradas). */
  readonly recent: AttendanceCounts;
  readonly previous: AttendanceCounts;
}

export interface Seed {
  readonly careers: readonly Career[];
  readonly subjects: readonly Subject[];
  readonly curriculum: readonly CurriculumEntry[];
  readonly terms: readonly Term[];
  readonly teachers: readonly Person[];
  readonly tutors: readonly Person[];
  readonly students: readonly Person[];
  readonly groups: readonly Group[];
  readonly enrollments: readonly Enrollment[];
  readonly assignments: readonly TeachingAssignment[];
  readonly schedules: readonly Schedule[];
  readonly facts: readonly SubjectEnrollmentFact[];
  readonly alerts: readonly Alert[];
}

// ---------------------------------------------------------------- utilidades

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** UUID determinista: `kind` identifica la entidad; `n` su número. */
function uid(kind: number, n: number): string {
  return `${kind.toString(16).padStart(8, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

const KIND = {
  career: 0xca000000,
  subject: 0x5b000000,
  term: 0x7f0c1a10,
  group: 0x62000000,
  enrollment: 0xe1000000,
  assignment: 0xa5000000,
  schedule: 0x5c000000,
  fact: 0xfa000000,
  alert: 0xa1000000,
  person: 0x8a1d0000,
} as const;

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const FIRST = [
  'Ana', 'Luis', 'María', 'Carlos', 'Sofía', 'Diego', 'Valentina', 'Mateo', 'Camila', 'Santiago', 'Regina', 'Emilio',
  'Ximena', 'Rodrigo', 'Daniela', 'Fernando', 'Paula', 'Adrián', 'Renata', 'Iván', 'Natalia', 'Bruno', 'Mariana', 'Hugo',
];
const LAST = [
  'Aguilar', 'Barrera', 'Cano', 'Domínguez', 'Escobar', 'Fuentes', 'Garza', 'Hidalgo', 'Ibáñez', 'Juárez', 'Lozano', 'Maldonado',
  'Navarro', 'Ochoa', 'Peña', 'Quintero', 'Robles', 'Salazar', 'Treviño', 'Urbina', 'Valdez', 'Zamora', 'Cantú', 'Rangel',
];
const TUTOR_NAMES: readonly [string, string][] = [
  ['Valeria', 'Núñez Orozco'],
  ['Óscar', 'Lara Vidal'],
  ['Paola', 'Cisneros Ruiz'],
  ['Gerardo', 'Pineda Solís'],
  ['Itzel', 'Camacho Rojas'],
];
const TEACHER_NAMES: readonly [string, string][] = [
  ['Marisol', 'Vega Ortiz'], ['Ricardo', 'Duarte Leal'], ['Lucía', 'Fernández Mora'], ['Andrés', 'Montoya Prieto'],
  ['Sofía', 'Barrientos Gil'], ['Tomás', 'Ibarra Cruz'], ['Elena', 'Cordero Páez'], ['Julián', 'Cabrera Soto'],
  ['Karla', 'Esparza Luna'], ['Mauricio', 'Beltrán Ríos'], ['Alma', 'Contreras Vela'], ['Raúl', 'Segura Bravo'],
  ['Nadia', 'Orduña Pérez'], ['Félix', 'Granados Rey'], ['Irma', 'Villalobos Nava'],
];

function person(n: number, number: string, first: string, last: string): Person {
  return { id: uid(KIND.person, n), institutional_number: number, first_name: first, last_name: last };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function pct(c: AttendanceCounts): number | null {
  const den = c.present + c.late + c.absent; // los JUSTIFIED salen del denominador
  return den === 0 ? null : round2(((c.present + c.late) / den) * 100);
}

// ---------------------------------------------------------------- catálogo

const CAREER: Career = { id: uid(KIND.career, 1), code: 'TIC', name: 'Tecnologías de la Información', is_active: true };

const LEVEL5 = [
  'Inglés VII',
  'Desarrollo WEB Profesional',
  'Administración de Bases de Datos',
  'Seguridad en el Desarrollo de Aplicaciones',
  'Matemáticas para Ingeniería II',
  'Planeación y Organización del Trabajo',
];
const BASES = [
  'Matemáticas para Ingeniería', 'Programación', 'Bases de Datos', 'Redes de Computadoras', 'Desarrollo Web',
  'Sistemas Operativos', 'Ingeniería de Software', 'Seguridad Informática', 'Administración de Proyectos',
  'Expresión Oral y Escrita', 'Física Aplicada', 'Ética Profesional',
];

function buildCatalog(): { subjects: Subject[]; curriculum: CurriculumEntry[] } {
  const subjects: Subject[] = [];
  const curriculum: CurriculumEntry[] = [];
  for (let level = 1; level <= 11; level++) {
    const names =
      level === 5
        ? LEVEL5
        : [`Inglés ${ROMAN[level]}`, ...[0, 1, 2, 3, 4].map((k) => `${BASES[(level * 3 + k) % BASES.length]} ${ROMAN[level]}`)];
    names.forEach((name, k) => {
      const subject: Subject = { id: uid(KIND.subject, level * 10 + k), code: `TIC${level}${k + 1}`, name, is_active: true };
      subjects.push(subject);
      curriculum.push({ career_id: CAREER.id, subject_id: subject.id, level, subject_code: subject.code, subject_name: name });
    });
  }
  return { subjects, curriculum };
}

const TERMS: readonly Term[] = [
  { id: uid(KIND.term, 1), name: 'Ene - Abr 2026', start_date: '2026-01-12', end_date: '2026-04-24', status: 'closed' },
  { id: uid(KIND.term, 2), name: 'May - Ago 2026', start_date: '2026-05-04', end_date: '2026-08-21', status: 'closed' },
  { id: uid(KIND.term, 3), name: 'Sep - Dic 2026', start_date: '2026-09-01', end_date: '2026-12-18', status: 'active' },
  { id: uid(KIND.term, 4), name: 'Ene - Abr 2027', start_date: '2027-01-11', end_date: '2027-04-23', status: 'draft' },
];

// ---------------------------------------------------------------- horario (módulos de 50 min)

const MODULE_MIN = 50;
const DAY_START = 17 * 60;
const MODULES_PER_DAY = 5; // 2 antes del descanso (18:40–19:00) y 3 después
const WEEK_DAYS = 5;

function moduleRange(index: number): { start: number; end: number } {
  const afterBreak = index >= 2 ? 20 : 0;
  const start = DAY_START + index * MODULE_MIN + afterBreak;
  return { start, end: start + MODULE_MIN };
}

function hhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- construcción

export function buildSeed(): Seed {
  const rnd = mulberry32(20260901);
  const { subjects, curriculum } = buildCatalog();

  // Personas
  const account = (n: number) => MOCK_ACCOUNTS[n - 1].user;
  const asPerson = (u: { id: string; institutional_number: string; first_name: string; last_name: string }): Person => ({
    id: u.id,
    institutional_number: u.institutional_number,
    first_name: u.first_name,
    last_name: u.last_name,
  });
  const tutors: Person[] = [
    asPerson(account(3)),
    ...TUTOR_NAMES.map(([f, l], i) => person(300 + i, `1000${String(10 + i).padStart(4, '0')}`, f, l)),
  ];
  const teachers: Person[] = [
    asPerson(account(2)),
    ...TEACHER_NAMES.map(([f, l], i) => person(400 + i, `1000${String(100 + i).padStart(4, '0')}`, f, l)),
  ];
  const studentPool: Person[] = [asPerson(account(1))];
  const pushStudent = (): Person => {
    const k = studentPool.length; // 0 es el alumno demo
    const p = person(
      1000 + k,
      String(22170001 + k),
      FIRST[k % FIRST.length],
      `${LAST[Math.floor(k / FIRST.length) % LAST.length]} ${LAST[(k * 7 + Math.floor(k / FIRST.length)) % LAST.length]}`,
    );
    studentPool.push(p);
    return p;
  };

  // Grupos del periodo activo (código, nivel, índice de tutor o null) y de periodos cerrados
  const activeDefs: readonly [string, number, number | null][] = [
    ['5A', 5, 0], ['5B', 5, 1], ['7A', 7, 2], ['10A', 10, 3], ['1A', 1, 4], ['1B', 1, 5],
    ['2A', 2, 1], ['3A', 3, 2], ['3B', 3, 3], ['4A', 4, 4], ['6A', 6, 5], ['8A', 8, null],
  ];
  const pastDefs: readonly [number, string, number][] = [
    [1, '1A', 1], [1, '2A', 2], [1, '3A', 3], [1, '4A', 4],
    [2, '5A', 5], [2, '5B', 5], [2, '6A', 6], [2, '7A', 7],
  ];

  const groups: Group[] = [];
  const enrollments: Enrollment[] = [];
  const assignments: TeachingAssignment[] = [];
  const schedules: Schedule[] = [];
  const facts: SubjectEnrollmentFact[] = [];
  const alerts: Alert[] = [];
  let enrollSeq = 1;
  let assignSeq = 1;
  let scheduleSeq = 1;
  let factSeq = 1;
  let alertSeq = 1;

  const teacherBusy = new Map<string, Set<string>>();
  const makeGroup = (termIdx: number, code: string, level: number, tutorIdx: number | null): Group => {
    const term = TERMS[termIdx];
    const g: Group = {
      id: uid(KIND.group, groups.length + 1),
      academic_term_id: term.id,
      academic_term_name: term.name,
      career_id: CAREER.id,
      career_code: CAREER.code,
      career_name: CAREER.name,
      tutor_id: tutorIdx === null ? null : tutors[tutorIdx % tutors.length].id,
      code,
      level,
    };
    groups.push(g);
    return g;
  };

  const assign = (group: Group, groupIdx: number, withSchedule: boolean): TeachingAssignment[] => {
    const entries = curriculum.filter((c) => c.level === group.level);
    const offset = (groupIdx * 4) % (WEEK_DAYS * MODULES_PER_DAY);
    return entries.map((entry, i) => {
      // Módulos semanales de esta asignación (4 módulos = 3 h 20 min), rotados por grupo.
      const slots = [0, 1, 2, 3].map((m) => (offset + i * 4 + m) % (WEEK_DAYS * MODULES_PER_DAY));
      const keys = slots.map((s) => `${Math.floor(s / MODULES_PER_DAY) + 1}:${s % MODULES_PER_DAY}`);
      // Con horario, el docente debe estar libre en esos módulos (sin choques entre grupos); si nadie lo está, se añade uno.
      let teacher: Person | undefined;
      if (withSchedule) {
        for (let n = 0; n < teachers.length && !teacher; n++) {
          const candidate = teachers[(groupIdx * 3 + i + n) % teachers.length];
          if (!keys.some((key) => teacherBusy.get(candidate.id)?.has(key))) teacher = candidate;
        }
        if (!teacher) {
          const extra = teachers.length;
          teacher = person(400 + extra, `1000${String(100 + extra).padStart(4, '0')}`, 'Docente', `Invitado ${extra}`);
          teachers.push(teacher);
        }
      } else {
        teacher = teachers[(groupIdx + i) % teachers.length];
      }
      if (withSchedule) {
        const busy = teacherBusy.get(teacher.id) ?? new Set<string>();
        keys.forEach((k) => busy.add(k));
        teacherBusy.set(teacher.id, busy);
      }
      const a: TeachingAssignment = {
        id: uid(KIND.assignment, assignSeq++),
        group_id: group.id,
        group_code: group.code,
        subject_id: entry.subject_id,
        subject_code: entry.subject_code,
        subject_name: entry.subject_name,
        teacher_id: teacher.id,
        teacher_name: `${teacher.first_name} ${teacher.last_name}`,
      };
      assignments.push(a);
      if (withSchedule) {
        // Une módulos contiguos del mismo día y de la misma mitad (antes/después del descanso).
        const sorted = slots
          .map((s) => ({ day: Math.floor(s / MODULES_PER_DAY) + 1, mod: s % MODULES_PER_DAY }))
          .sort((x, y) => x.day - y.day || x.mod - y.mod);
        let run: { day: number; first: number; last: number } | null = null;
        const flush = (): void => {
          if (!run) return;
          schedules.push({
            id: uid(KIND.schedule, scheduleSeq++),
            teaching_assignment_id: a.id,
            day_of_week: run.day,
            start_time: hhmm(moduleRange(run.first).start),
            end_time: hhmm(moduleRange(run.last).end),
            classroom: `Aula ${200 + groupIdx}`,
          });
        };
        for (const s of sorted) {
          const sameHalf = run !== null && (run.last < 2) === (s.mod < 2);
          if (run && run.day === s.day && s.mod === run.last + 1 && sameHalf) {
            run.last = s.mod;
          } else {
            flush();
            run = { day: s.day, first: s.mod, last: s.mod };
          }
        }
        flush();
      }
      return a;
    });
  };

  const enroll = (group: Group, students: Person[], withdrawn: number): void => {
    students.forEach((s, i) => {
      enrollments.push({
        id: uid(KIND.enrollment, enrollSeq++),
        group_id: group.id,
        student_id: s.id,
        status: i >= students.length - withdrawn ? 'WITHDRAWN' : 'ACTIVE',
        enrolled_at: '2026-08-24T15:00:00Z',
        student: s,
      });
    });
  };

  // Periodo activo: alumnos únicos por grupo + hechos académicos
  activeDefs.forEach(([code, level, tutorIdx], idx) => {
    const group = makeGroup(2, code, level, tutorIdx);
    const size = code === '5A' ? 28 : 24 + Math.floor(rnd() * 8);
    const students: Person[] = [];
    if (code === '5A') students.push(studentPool[0]); // el alumno demo cursa 5A
    while (students.length < size) students.push(pushStudent());
    const withdrawn = code === '5A' ? 1 : rnd() < 0.5 ? 1 : 0;
    enroll(group, students, withdrawn);
    const groupAssignments = assign(group, idx, true);

    students.slice(0, students.length - withdrawn).forEach((student) => {
      const lowGrades = student.id !== studentPool[0].id && rnd() < 0.012;
      const dropper = student.id !== studentPool[0].id && rnd() < 0.012;
      groupAssignments.forEach((a, ai) => {
        const scores = [0, 1].map(() => {
          const base = lowGrades && ai % 2 === 0 ? 72 + (rnd() - 0.5) * 16 : 91 + (rnd() - 0.5) * 9;
          return round2(Math.min(100, Math.max(60, base)));
        });
        const window = (p: number): AttendanceCounts => {
          let present = 0;
          let late = 0;
          let absent = 0;
          let justified = 0;
          for (let s = 0; s < 8; s++) {
            const r = rnd();
            if (r < p) {
              if (rnd() < 0.3) justified++;
              else absent++;
            } else if (r < p + 0.05) late++;
            else present++;
          }
          return { present, late, absent, justified };
        };
        facts.push({
          id: uid(KIND.fact, factSeq++),
          student_id: student.id,
          group_id: group.id,
          teaching_assignment_id: a.id,
          scores,
          units_total: 3,
          recent: window(dropper ? 0.4 : 0.02),
          previous: window(0.02),
        });
      });
    });
  });

  // Periodos cerrados: inscripciones y asignaciones (sin hechos académicos ni horarios)
  pastDefs.forEach(([termIdx, code, tutorIdx], idx) => {
    const level = Number.parseInt(code, 10);
    const group = makeGroup(termIdx - 1, code, level, tutorIdx);
    const students: Person[] = [];
    for (let k = 0; k < 20; k++) students.push(studentPool[1 + ((idx * 20 + k) % (studentPool.length - 1))]);
    enroll(group, students, 0);
    assign(group, 20 + idx, false);
  });

  // Alumnos sin grupo (para probar "Inscribir alumno"), incluida la cuenta demo de cambio de contraseña
  studentPool.push(asPerson(account(5)));
  for (let k = 0; k < 6; k++) pushStudent();

  // Alertas persistidas (última recalculación): se derivan de los hechos con las reglas del backend
  const termOf = new Map(TERMS.map((t) => [t.id, t]));
  const studentById = new Map(studentPool.map((s) => [s.id, s]));
  const assignmentById = new Map(assignments.map((a) => [a.id, a]));
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const evaluated = '2026-11-20T15:00:00Z';
  const rules: Record<AlertRule, string> = {
    GRADE_NA_UNIT: 'A captured unit grade is below 80 (category NA).',
    UNJUSTIFIED_ABSENCES: 'ABSENT records of closed sessions in one subject reach the configured threshold.',
    ATTENDANCE_DROP: 'Attendance of the recent window dropped against the previous one.',
    PENDING_JUSTIFICATIONS: 'Justification requests are waiting for a decision.',
  };
  for (const f of facts) {
    const student = studentById.get(f.student_id);
    const a = assignmentById.get(f.teaching_assignment_id);
    const g = groupById.get(f.group_id);
    if (!student || !a || !g) continue;
    const term = termOf.get(g.academic_term_id);
    if (!term) continue;
    const push = (rule: AlertRule, message: string, evidence: Record<string, unknown>): void => {
      alerts.push({
        id: uid(KIND.alert, alertSeq++),
        rule,
        rule_description: rules[rule],
        status: rnd() < 0.75 ? 'OPEN' : 'ACKNOWLEDGED',
        message,
        evidence,
        student,
        group: { id: g.id, code: g.code },
        academic_term: { id: term.id, name: term.name },
        subject: { subject_enrollment_id: f.id, code: a.subject_code, name: a.subject_name },
        created_at: evaluated,
        updated_at: evaluated,
        evaluated_at: evaluated,
        resolved_at: null,
      });
    };
    const na = f.scores.filter((s) => s < 80);
    if (na.length > 0) {
      push('GRADE_NA_UNIT', `${na.length} unidad(es) con categoría NA en ${a.subject_name}`, { na_units: na.length, scores: na });
    }
    const absent = f.recent.absent + f.previous.absent;
    if (absent >= 3) {
      push('UNJUSTIFIED_ABSENCES', `${absent} faltas sin justificar en ${a.subject_name}`, { unjustified_absences: absent, threshold: 3 });
    }
    const recent = pct(f.recent);
    const previous = pct(f.previous);
    if (recent !== null && previous !== null && previous - recent >= 20) {
      push('ATTENDANCE_DROP', `La asistencia bajó ${round2(previous - recent)} puntos en ${a.subject_name}`, {
        recent_pct: recent,
        previous_pct: previous,
        threshold_points: 20,
      });
    }
  }

  return {
    careers: [CAREER],
    subjects,
    curriculum,
    terms: TERMS,
    teachers,
    tutors,
    students: studentPool,
    groups,
    enrollments,
    assignments,
    schedules,
    facts,
    alerts,
  };
}
