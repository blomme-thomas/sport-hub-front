import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { addIsoDays, localIsoDate } from '../../../shared/utils/iso-date';
import { isoWeekOf, mondayOfIsoWeek, shiftIsoWeek } from '../../../shared/utils/iso-week';
import type { WeekMiniLegendEntry, WeekMiniSession } from '../models/week-mini-calendar.model';
import { WeekSessionsApi } from './week-sessions.api';

const DAYS_PER_WEEK = 7;

/** Jour du mini-calendrier : sa date et les séances planifiées de ce jour, triées par heure. */
export interface WeekMiniDay {
  date: string;
  sessions: WeekMiniSession[];
}

/**
 * État du mini-calendrier du tableau de bord : semaine affichée, séances et légende. Changer de semaine recharge ;
 * une réponse périmée est ignorée. Lecture seule. Fourni au niveau de la page.
 */
@Injectable()
export class WeekMiniCalendarState {
  private readonly api = inject(WeekSessionsApi);
  private readonly weekValue = signal(isoWeekOf(localIsoDate()));
  private readonly sessionsValue = signal<readonly WeekMiniSession[]>([]);
  private readonly labelsValue = signal<ReadonlyMap<string, string>>(new Map());
  private readonly loadingValue = signal(true);
  private readonly errorValue = signal<AppError | null>(null);
  private latestRequest = 0;

  readonly weekStart = computed(() => mondayOfIsoWeek(this.weekValue()));
  readonly weekEnd = computed(() => addIsoDays(this.weekStart(), DAYS_PER_WEEK - 1));
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly isEmpty = computed(() => !this.loadingValue() && this.sessionsValue().length === 0);

  readonly days = computed<WeekMiniDay[]>(() => {
    const start = this.weekStart();
    const byDate = new Map<string, WeekMiniSession[]>();
    for (const session of this.sessionsValue()) {
      byDate.set(session.date, [...(byDate.get(session.date) ?? []), session]);
    }
    return Array.from({ length: DAYS_PER_WEEK }, (_, index) => {
      const date = addIsoDays(start, index);
      const sessions = [...(byDate.get(date) ?? [])].sort((a, b) =>
        (a.startTime ?? '').localeCompare(b.startTime ?? ''),
      );
      return { date, sessions };
    });
  });

  /** Disciplines présentes sur la semaine, avec leur libellé du référentiel (la clé brute si elle est inconnue). */
  readonly legend = computed<WeekMiniLegendEntry[]>(() => {
    const labels = this.labelsValue();
    const keys = new Set(this.sessionsValue().map((session) => session.disciplineTypeKey));
    return [...keys].map((typeKey) => ({ typeKey, label: labels.get(typeKey) ?? typeKey }));
  });

  constructor() {
    void this.reload();
  }

  previousWeek(): void {
    this.goTo(shiftIsoWeek(this.weekValue(), -1));
  }

  nextWeek(): void {
    this.goTo(shiftIsoWeek(this.weekValue(), 1));
  }

  currentWeek(): void {
    this.goTo(isoWeekOf(localIsoDate()));
  }

  reload(): Promise<void> {
    return this.load();
  }

  private goTo(week: string): void {
    this.weekValue.set(week);
    void this.load();
  }

  private async load(): Promise<void> {
    const request = ++this.latestRequest;
    const start = this.weekStart();
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      const [sessions, labels] = await Promise.all([
        firstValueFrom(this.api.list(start, this.weekEnd())),
        firstValueFrom(this.api.disciplineLabels()),
      ]);
      if (request !== this.latestRequest) {
        return;
      }
      this.sessionsValue.set(sessions);
      this.labelsValue.set(labels);
    } catch (error) {
      if (request === this.latestRequest) {
        this.sessionsValue.set([]);
        this.errorValue.set(error instanceof AppError ? error : toAppError(error));
      }
    } finally {
      if (request === this.latestRequest) {
        this.loadingValue.set(false);
      }
    }
  }
}
