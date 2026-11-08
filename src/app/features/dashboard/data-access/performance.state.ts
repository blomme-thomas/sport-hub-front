import { Injectable, Signal, computed, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { DashboardKpisApi } from './dashboard-kpis.api';
import { type PerformanceSeries, toPerformanceSeries } from './performance.mapper';

export const PERFORMANCE_PERIODS = ['7d', '30d', '3m', '1y'] as const;
export type PerformancePeriod = (typeof PERFORMANCE_PERIODS)[number];

/** État de la carte « Vos performances » : période locale à la carte, indépendante du reste du tableau de bord. */
@Injectable()
export class PerformanceState {
  private readonly api = inject(DashboardKpisApi);
  readonly period = signal<PerformancePeriod>('7d');

  private readonly response = resource({
    params: () => this.period(),
    loader: ({ params }) => firstValueFrom(this.api.get(params)),
  });

  readonly series: Signal<PerformanceSeries | undefined> = computed(() =>
    this.response.hasValue() ? toPerformanceSeries(this.response.value()) : undefined,
  );

  readonly isLoading = computed(() => this.response.isLoading());

  readonly error = computed<AppError | null>(() => {
    const error = this.response.error();
    if (error === undefined) {
      return null;
    }
    return error instanceof AppError ? error : toAppError(error);
  });

  setPeriod(period: PerformancePeriod): void {
    this.period.set(period);
  }

  reload(): void {
    this.response.reload();
  }
}
