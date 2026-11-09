import { Injectable, Signal, computed, inject, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { DashboardKpisApi } from './dashboard-kpis.api';
import { DashboardState } from './dashboard.state';
import { metricsPeriodFor } from './metrics-period';
import { type PerformanceSeries, toPerformanceSeries, toWeeklySeries } from './performance.mapper';

export const PERFORMANCE_PERIODS = ['7d', '30d', '3m', '1y'] as const;
export type PerformancePeriod = (typeof PERFORMANCE_PERIODS)[number];

/** État de la carte « Vos performances » : sa période suit la temporalité choisie en haut à droite. */
@Injectable()
export class PerformanceState {
  private readonly api = inject(DashboardKpisApi);
  private readonly dashboard = inject(DashboardState);
  readonly period = computed<PerformancePeriod>(() =>
    metricsPeriodFor(this.dashboard.granularity()),
  );

  private readonly response = resource({
    params: () => this.period(),
    loader: ({ params }) => firstValueFrom(this.api.get(params)),
  });

  /** Regroupement de la série : par jour en vue semaine, par semaine ISO en vue mois. */
  readonly grouping = computed<'day' | 'week'>(() =>
    this.dashboard.granularity() === 'month' ? 'week' : 'day',
  );

  readonly series: Signal<PerformanceSeries | undefined> = computed(() => {
    if (!this.response.hasValue()) {
      return undefined;
    }
    const api = this.response.value();
    return this.grouping() === 'week' ? toWeeklySeries(api) : toPerformanceSeries(api);
  });

  readonly isLoading = computed(() => this.response.isLoading());

  readonly error = computed<AppError | null>(() => {
    const error = this.response.error();
    if (error === undefined) {
      return null;
    }
    return error instanceof AppError ? error : toAppError(error);
  });

  reload(): void {
    this.response.reload();
  }
}
