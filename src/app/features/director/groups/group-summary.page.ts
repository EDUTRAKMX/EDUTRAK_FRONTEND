import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeftRight,
  LucideChevronRight,
  LucideCircleAlert,
  LucideCircleCheck,
  LucideClock,
  LucideBookMarked,
  LucideGraduationCap,
  LucideUserPlus,
} from '@lucide/angular';
import { initialsOf } from '../../../core/auth/profile';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Group } from '../../../shared/models/academic.model';
import { compactTermName } from '../../../shared/utils/date-format';
import { dayOfWeekOf, firstSlotChip, rangeLabel } from '../schedules/schedule-utils';
import { AssignTutorDialogComponent } from './assign-tutor-dialog.component';
import { GroupDetailService } from './group-detail.service';
import { fullName, sectionOf } from './groups.vm';

/**
 * Resumen del grupo. Desktop: Figma 78:4528 (4 indicadores, Información del grupo, Materias con chip de primera clase).
 * Mobile: Figma 183:7164 (indicadores 2×2, Información y Materias con "Hoy"). Datos de `GroupDetailService`
 * (mismos repositorios que el resto del módulo). "Cambiar tutor" usa el modal/bottom sheet de asignación (83:5427 / 183:12054).
 */
@Component({
  selector: 'edu-group-summary-page',
  imports: [AssignTutorDialogComponent, AvatarComponent, IconComponent, RouterLink, StatCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-[10px]' },
  template: `
    @if (vm(); as d) {
      <section class="grid grid-cols-2 gap-[10px] lg:grid-cols-4" aria-label="Indicadores del grupo">
        <a [routerLink]="['/director/grupos', d.group.id, 'alumnos']" class="contents lg:pointer-events-none" aria-label="Ver alumnos del grupo">
          <edu-stat-card label="Alumnos" [icon]="icons.students" tone="info" [value]="'' + d.analytics.active_students" class="min-w-0">
            <span class="font-semibold text-info-fg">{{ d.analytics.active_students }}</span> activos · {{ d.enrollments.length }} en total
          </edu-stat-card>
        </a>
        <edu-stat-card label="Asistencia" [icon]="icons.attendance" tone="success" [value]="percent(d.analytics.attendance.attendance_pct)">
          @if (d.indicators.attendance_delta_pp !== null) {
            <span class="font-semibold" [class]="d.indicators.attendance_delta_pp >= 0 ? 'text-success-fg' : 'text-danger-fg'">{{ signed(d.indicators.attendance_delta_pp) }}pp</span> vs 4 semanas previas
          } @else {
            sin sesiones cerradas
          }
        </edu-stat-card>
        <edu-stat-card label="Alertas" [icon]="icons.alerts" tone="warning" [value]="'' + d.analytics.open_alerts">
          <span class="font-semibold text-warning-fg">{{ needReview() }}</span> requieren revisión
        </edu-stat-card>
        <edu-stat-card label="Materias" [icon]="icons.subjects" tone="success" [value]="'' + d.assignments.length">
          <span class="font-semibold text-success-fg">{{ teachers() }}</span> Profesores
        </edu-stat-card>
      </section>

      <div class="grid items-start gap-[10px] lg:grid-cols-2">
        <section class="flex min-w-0 flex-col gap-4 rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card-lg" aria-labelledby="info-grupo">
          <h2 id="info-grupo" class="m-0 text-[18px] font-bold leading-[normal] tracking-[0.72px] text-ink">Información del grupo</h2>
          <div class="flex items-center gap-3 rounded-panel bg-canvas px-4 py-3">
            @if (d.tutor; as tutor) {
              <edu-avatar [initials]="initials(tutor)" [size]="32" [textSize]="13" />
              <div class="flex min-w-0 flex-col"><span class="text-[11px] leading-[normal] text-muted">Tutor asignado</span><span class="truncate text-[15px] font-bold leading-[normal] text-ink">{{ name(tutor) }}</span></div>
            } @else {
              <div class="flex min-w-0 flex-col"><span class="text-[11px] leading-[normal] text-muted">Tutor asignado</span><span class="text-[13px] font-bold uppercase leading-[normal] text-warning-fg">Sin asignar</span></div>
            }
          </div>
          @if (d.term.status !== 'closed') {
            <button type="button" class="inline-flex h-10 w-fit items-center gap-2 rounded-button border border-border bg-surface px-4 text-[14px] font-semibold text-ink hover:bg-canvas" (click)="assignOpen.set(true)">
              <edu-icon [name]="d.tutor ? icons.swap : icons.assign" [size]="18" /> {{ d.tutor ? 'Cambiar tutor' : 'Asignar tutor' }}
            </button>
          }
          <dl class="m-0 flex flex-col gap-2 border-t border-dashed border-border pt-4 text-[13px] leading-[normal]">
            <div class="flex justify-between gap-3"><dt class="text-muted">Cuatrimestre</dt><dd class="m-0 font-bold text-ink">{{ d.group.level }}°</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-muted">Sección</dt><dd class="m-0 font-bold text-ink">{{ section(d.group) || '—' }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-muted">Código</dt><dd class="m-0 font-bold text-ink">{{ d.group.code }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-muted">Periodo</dt><dd class="m-0 font-bold text-ink">{{ term(d.term.name) }}</dd></div>
          </dl>
        </section>

        <section class="flex min-w-0 flex-col gap-3 rounded-card border border-border bg-surface px-[21px] py-[17px] shadow-card-lg" aria-labelledby="materias-grupo">
          <header class="flex items-start justify-between gap-3">
            <h2 id="materias-grupo" class="m-0 text-[18px] font-bold leading-[normal] tracking-[0.72px] text-ink">Materias</h2>
            <a [routerLink]="['/director/horarios', d.group.id]" class="inline-flex shrink-0 items-center gap-[2px] text-[11px] font-bold leading-[normal] text-success-fg hover:underline">Ver horario <edu-icon [name]="icons.chevron" [size]="12" /></a>
          </header>

          <!-- Escritorio: materias con profesor y chip de su primera clase -->
          <ul class="m-0 hidden list-none flex-col p-0 lg:flex">
            @for (a of d.assignments; track a.id) {
              <li class="border-t border-border first:border-t-0">
                <a [routerLink]="['/director/horarios', d.group.id]" class="flex items-center gap-3 py-3 hover:bg-canvas">
                  <span class="flex min-w-0 flex-1 flex-col gap-1">
                    <span class="text-[14px] font-bold leading-[normal] text-ink">{{ a.subject_name }}</span>
                    <span class="flex items-center gap-1 text-[12px] leading-[normal] text-muted">
                      <edu-avatar [initials]="initials(a.teacher_name)" [size]="16" [textSize]="7" />{{ a.teacher_name }}
                    </span>
                  </span>
                  @if (chip(a.id); as c) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-neutral-bg px-[9px] py-[3px] text-[10px] font-semibold leading-[normal] text-muted"><edu-icon [name]="icons.clock" [size]="11" />{{ c }}</span>
                  }
                  <edu-icon [name]="icons.chevron" [size]="18" class="text-muted" />
                </a>
              </li>
            } @empty {
              <li class="py-6 text-center text-[13px] text-muted">Este grupo aún no tiene materias asignadas.</li>
            }
          </ul>

          <!-- Móvil: clases de hoy (Figma 183:7164) -->
          <div class="flex flex-col gap-2 lg:hidden">
            <p class="m-0 text-[14px] font-bold leading-[normal] text-ink">Hoy</p>
            <ul class="m-0 flex list-none flex-col rounded-panel border border-border p-0">
              @for (s of today(); track s.id) {
                <li class="flex flex-col gap-[2px] border-t border-border px-3 py-3 first:border-t-0">
                  <span class="text-[12px] font-semibold leading-[normal] text-info-fg">{{ range(s.start_time, s.end_time) }}</span>
                  <span class="text-[14px] font-bold leading-[normal] text-ink">{{ s.subject_name }}</span>
                  <span class="text-[11px] leading-[normal] text-muted">{{ s.teacher_name }}</span>
                </li>
              } @empty {
                <li class="px-3 py-6 text-center text-[13px] text-muted">Sin clases programadas hoy.</li>
              }
            </ul>
          </div>
        </section>
      </div>

      <edu-assign-tutor-dialog
        [(open)]="assignOpen"
        [groupId]="d.group.id"
        [currentTutorId]="d.group.tutor_id"
        [currentTutorName]="d.tutor ? name(d.tutor) : null"
        (assigned)="onAssigned($event)"
      />
    }
  `,
})
export class GroupSummaryPage {
  private readonly state = inject(GroupDetailService);
  private readonly toast = inject(ToastService);
  protected readonly vm = this.state.vm;
  protected readonly assignOpen = signal(false);

  protected readonly icons = {
    students: LucideGraduationCap,
    attendance: LucideCircleCheck,
    alerts: LucideCircleAlert,
    subjects: LucideBookMarked,
    swap: LucideArrowLeftRight,
    assign: LucideUserPlus,
    chevron: LucideChevronRight,
    clock: LucideClock,
  };

  protected readonly needReview = computed(() => this.vm()?.alerts.filter((a) => a.status === 'OPEN').length ?? 0);
  protected readonly teachers = computed(() => new Set(this.vm()?.assignments.map((a) => a.teacher_id)).size);
  protected readonly today = computed(() => {
    const day = dayOfWeekOf(new Date());
    return (this.vm()?.schedules ?? [])
      .filter((s) => s.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  protected chip(assignmentId: string): string | null {
    return firstSlotChip((this.vm()?.schedules ?? []).filter((s) => s.teaching_assignment_id === assignmentId));
  }

  protected percent(v: number | null): string {
    return v === null ? '—' : `${Math.round(v)}%`;
  }
  protected signed(v: number): string {
    return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;
  }
  protected initials(name: string | { first_name: string; last_name: string }): string {
    return initialsOf(typeof name === 'string' ? name : fullName(name));
  }
  protected name(p: { first_name: string; last_name: string }): string {
    return fullName(p);
  }
  protected section(g: Group): string {
    return sectionOf(g.code);
  }
  protected term(name: string): string {
    return compactTermName(name);
  }
  protected range(a: string, b: string): string {
    return rangeLabel(a, b);
  }

  protected onAssigned(group: Group): void {
    this.toast.success(group.tutor_id ? 'Tutor asignado' : 'Tutor retirado', `Grupo ${group.code} actualizado.`);
    this.state.reload();
  }
}
