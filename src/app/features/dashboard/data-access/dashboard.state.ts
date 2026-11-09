import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { keepLast } from './hold-last';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { TrainingStatsResponseApi } from '../models/training-stats.api-model';
import {
  type DashboardPeriod,
  type DashboardView,
  type Granularity,
  granularityOf,
} from '../models/training-stats.model';
import { TrainingStatsApi } from './training-stats.api';
import { toDashboardView } from './training-stats.mapper';

const MILLISECONDS_PER_DAY = 86_400_000;
const WEEKS_SHOWN = 8;
const MONTHS_SHOWN = 6;

interface DateRange {
  from: string;
  to: string;
}

/**
 * État du tableau de bord : granularité choisie et statistiques chargées pour la plage glissante qui
 * contient aujourd'hui (8 semaines ISO ou 6 mois, en UTC). Fourni au niveau de la page, il est partagé
 * avec la modale d'agrandissement, qui ne déclenche donc aucun appel supplémentaire.
 */
@Injectable()
export class DashboardState {
  private readonly api = inject(TrainingStatsApi);
  private readonly periodValue = signal<DashboardPeriod>('7d');

  /** Granularité des graphiques, dérivée de la période (semaines ou mois). */
  readonly granularity = computed<Granularity>(() => granularityOf(this.periodValue()));

  private readonly stats = resource<TrainingStatsResponseApi, Granularity>({
    params: () => this.granularity(),
    loader: ({ params }) =>
      firstValueFrom(this.api.get({ granularity: params, ...rangeFor(params, new Date()) })),
  });

  readonly period = this.periodValue.asReadonly();

  /** Vue du tableau de bord ; garde la précédente pendant un rechargement pour éviter un affichage vide. */
  readonly view = keepLast(
    () => (this.stats.hasValue() ? this.stats.value() : undefined),
    (response): DashboardView => ({
      ...toDashboardView(response),
      period: this.periodValue(),
    }),
  );

  readonly isLoading = computed(() => this.stats.isLoading());

  readonly error = computed<AppError | null>(() => {
    const error = this.stats.error();
    if (error === undefined) {
      return null;
    }
    return error instanceof AppError ? error : toAppError(error);
  });

  readonly isEmpty = computed(
    () =>
      this.stats.hasValue() &&
      this.stats.value().periods.every((period) => period.totals.count === 0),
  );

  setPeriod(period: DashboardPeriod): void {
    this.periodValue.set(period);
  }

  /**
   * Bascule de granularité depuis la modale d'un graphique : semaine → 7 jours, mois → 3 mois. Sans effet si la
   * granularité est déjà celle demandée.
   */
  setGranularity(granularity: Granularity): void {
    if (granularityOf(this.periodValue()) === granularity) {
      return;
    }
    this.periodValue.set(granularity === 'week' ? '7d' : '3m');
  }

  reload(): void {
    this.stats.reload();
  }
}

function rangeFor(granularity: Granularity, now: Date): DateRange {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  if (granularity === 'month') {
    return {
      from: isoDay(Date.UTC(year, month - (MONTHS_SHOWN - 1), 1)),
      to: isoDay(Date.UTC(year, month + 1, 0)),
    };
  }

  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  const monday = Date.UTC(year, month, now.getUTCDate() - daysSinceMonday);
  return {
    from: isoDay(monday - (WEEKS_SHOWN - 1) * 7 * MILLISECONDS_PER_DAY),
    to: isoDay(monday + 6 * MILLISECONDS_PER_DAY),
  };
}

function isoDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}
