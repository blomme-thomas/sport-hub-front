import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { addIsoDays, localIsoDate } from '../../../shared/utils/iso-date';
import { isoWeekOf, mondayOfIsoWeek } from '../../../shared/utils/iso-week';
import { disciplineStyleOf } from '../../../shared/ui/discipline/discipline-style';
import type {
  WeekMiniActivity,
  WeekMiniLegendEntry,
  WeekMiniSession,
} from '../models/week-mini-calendar.model';
import type { ActivitySummaryApi } from '../models/recent-activity.api-model';
import { DashboardState } from './dashboard.state';
import { RecentActivitiesApi } from './recent-activities.api';
import { toRecentActivity } from './recent-activities.mapper';
import { WeekSessionsApi } from './week-sessions.api';

const DAYS_PER_WEEK = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Activités réalisées chargées pour la grille ; au-delà, les excédentaires ne s'affichent pas. */
const ACTIVITY_PAGE_SIZE = 100;

/** Vue du mini-calendrier : une semaine, ou un mois. Elle suit le sélecteur Semaine/Mois du tableau de bord. */
export type MiniCalendarView = 'week' | 'month';

/**
 * Case du mini-calendrier : sa date, ses séances planifiées triées par heure, ses activités réalisées,
 * et si elle appartient à la période affichée.
 */
export interface WeekMiniDay {
  date: string;
  sessions: WeekMiniSession[];
  realized: WeekMiniActivity[];
  inPeriod: boolean;
}

/**
 * État du mini-calendrier du tableau de bord. La vue (semaine ou mois) suit la granularité choisie en haut à droite
 * du tableau de bord ; la navigation avance d'une semaine ou d'un mois. Un changement de période recharge les séances ;
 * une réponse périmée est ignorée. Lecture seule. Fourni au niveau de la page.
 */
@Injectable()
export class WeekMiniCalendarState {
  private readonly api = inject(WeekSessionsApi);
  private readonly activitiesApi = inject(RecentActivitiesApi);
  private readonly dashboard = inject(DashboardState);
  /** Date de référence : un jour de la période affichée (semaine ou mois). */
  private readonly anchorValue = signal(localIsoDate());
  private readonly sessionsValue = signal<readonly WeekMiniSession[]>([]);
  private readonly activitiesValue = signal<readonly ActivitySummaryApi[]>([]);
  private readonly labelsValue = signal<ReadonlyMap<string, string>>(new Map());
  private readonly loadingValue = signal(true);
  private readonly errorValue = signal<AppError | null>(null);
  private latestRequest = 0;
  private loaded = false;

  /** Semaine pour la période de 7 jours, mois sinon. */
  readonly view = computed<MiniCalendarView>(() =>
    this.dashboard.period() === '7d' ? 'week' : 'month',
  );

  /** Période affichée : la semaine ou le mois qui contient la date de référence. */
  private readonly period = computed(() => periodOf(this.view(), this.anchorValue()));

  /** Plage interrogée : la période, étendue aux jours de semaine voisins pour une grille de mois complète. */
  private readonly range = computed(() => gridRangeOf(this.period()));

  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly isEmpty = computed(
    () =>
      !this.loadingValue() &&
      this.sessionsValue().length === 0 &&
      this.activitiesValue().length === 0,
  );

  readonly title = computed(() => {
    const { start, end } = this.period();
    if (this.view() === 'month') {
      return capitalize(formatMonth(start));
    }
    return mondayOfDate(this.anchorValue()) === mondayOfDate(localIsoDate())
      ? 'Cette semaine'
      : `Semaine du ${formatShortDay(start)} au ${formatShortDay(end)}`;
  });

  readonly days = computed<WeekMiniDay[]>(() => {
    const { start, end } = this.period();
    const { from, to } = this.range();
    const byDate = new Map<string, WeekMiniSession[]>();
    for (const session of this.sessionsValue()) {
      byDate.set(session.date, [...(byDate.get(session.date) ?? []), session]);
    }
    const realizedByDate = this.realizedByDate();
    return datesBetween(from, to).map((date) => ({
      date,
      inPeriod: date >= start && date <= end,
      sessions: [...(byDate.get(date) ?? [])].sort((a, b) =>
        (a.startTime ?? '').localeCompare(b.startTime ?? ''),
      ),
      realized: realizedByDate.get(date) ?? [],
    }));
  });

  /** Disciplines présentes sur la période (planifiées ou réalisées), avec leur libellé du référentiel. */
  readonly legend = computed<WeekMiniLegendEntry[]>(() => {
    const labels = this.labelsValue();
    const keys = new Set([
      ...this.sessionsValue().map((session) => session.disciplineTypeKey),
      ...this.activitiesValue().map((activity) => activity.type),
    ]);
    return [...keys].map((typeKey) => ({ typeKey, label: labels.get(typeKey) ?? typeKey }));
  });

  /** Activités réalisées regroupées par jour local ; les activités hors de la plage sont ignorées par la grille. */
  private realizedByDate(): Map<string, WeekMiniActivity[]> {
    const byDate = new Map<string, WeekMiniActivity[]>();
    const now = new Date();
    for (const item of this.activitiesValue()) {
      const date = localIsoDate(new Date(item.startedAt));
      const recent = toRecentActivity(item, now);
      const activity: WeekMiniActivity = {
        id: item.id,
        label: `${recent.typeLabel}, ${recent.durationLabel}`,
        discipline: disciplineStyleOf(item.type),
      };
      byDate.set(date, [...(byDate.get(date) ?? []), activity]);
    }
    return byDate;
  }

  constructor() {
    // Chaque changement de période (navigation, ou bascule Semaine/Mois) recharge les séances de la plage.
    effect(() => {
      const { from, to } = this.range();
      untracked(() => void this.load(from, to));
    });
  }

  previous(): void {
    this.anchorValue.set(shiftPeriod(this.view(), this.anchorValue(), -1));
  }

  next(): void {
    this.anchorValue.set(shiftPeriod(this.view(), this.anchorValue(), 1));
  }

  today(): void {
    this.anchorValue.set(localIsoDate());
  }

  reload(): Promise<void> {
    const { from, to } = this.range();
    return this.load(from, to);
  }

  private async load(from: string, to: string): Promise<void> {
    const request = ++this.latestRequest;
    // Le chargement initial affiche « Chargement » ; un changement de période garde la grille en place.
    if (!this.loaded) {
      this.loadingValue.set(true);
    }
    this.errorValue.set(null);
    // Les libellés du référentiel ne changent pas d'une période à l'autre : on ne les demande qu'une fois.
    const needLabels = this.labelsValue().size === 0;
    try {
      const [sessions, activities, labels] = await Promise.all([
        firstValueFrom(this.api.list(from, to)),
        firstValueFrom(this.activitiesApi.inRange(from, to, ACTIVITY_PAGE_SIZE)),
        needLabels ? firstValueFrom(this.api.disciplineLabels()) : Promise.resolve(null),
      ]);
      if (request !== this.latestRequest) {
        return;
      }
      this.sessionsValue.set(sessions);
      this.activitiesValue.set(activities);
      if (labels !== null) {
        this.labelsValue.set(labels);
      }
      this.loaded = true;
    } catch (error) {
      if (request === this.latestRequest) {
        this.sessionsValue.set([]);
        this.activitiesValue.set([]);
        this.errorValue.set(error instanceof AppError ? error : toAppError(error));
      }
    } finally {
      if (request === this.latestRequest) {
        this.loadingValue.set(false);
      }
    }
  }
}

interface Period {
  start: string;
  end: string;
}

/** Semaine ISO ou mois civil qui contient la date. */
function periodOf(view: MiniCalendarView, anchor: string): Period {
  if (view === 'month') {
    return { start: `${anchor.slice(0, 7)}-01`, end: lastDayOfMonth(anchor) };
  }
  const start = mondayOfIsoWeek(isoWeekOf(anchor));
  return { start, end: addIsoDays(start, DAYS_PER_WEEK - 1) };
}

/** Plage de la grille : pour un mois, du lundi de la première semaine au dimanche de la dernière. */
function gridRangeOf(period: Period): { from: string; to: string } {
  const from = mondayOfIsoWeek(isoWeekOf(period.start));
  const weekday = (new Date(`${period.end}T00:00:00Z`).getUTCDay() + 6) % 7;
  return { from, to: addIsoDays(period.end, 6 - weekday) };
}

/** Période décalée d'une semaine ou d'un mois, en gardant un jour de référence valide. */
function shiftPeriod(view: MiniCalendarView, anchor: string, count: number): string {
  if (view === 'week') {
    return addIsoDays(anchor, count * DAYS_PER_WEEK);
  }
  const year = Number(anchor.slice(0, 4));
  const month = Number(anchor.slice(5, 7)) - 1 + count;
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}

function mondayOfDate(iso: string): string {
  return mondayOfIsoWeek(isoWeekOf(iso));
}

function lastDayOfMonth(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

/** Toutes les dates `YYYY-MM-DD` de `from` à `to` incluses. */
function datesBetween(from: string, to: string): string[] {
  const count = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY + 1;
  return Array.from({ length: count }, (_, index) => addIsoDays(from, index));
}

function formatShortDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function formatMonth(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
