import { Injectable, Signal, computed, inject } from '@angular/core';
import { DashboardKpisState } from './dashboard-kpis.state';
import { DashboardState } from './dashboard.state';
import { keepLast } from './hold-last';
import { type PerformanceSeries, toPerformanceSeries, toWeeklySeries } from './performance.mapper';

/** Regroupement de la série : par jour (vue semaine) ou par semaine ISO (vue mois). */
export type PerformanceGrouping = 'day' | 'week';

/** Série et regroupement, décidés ensemble : le type de graphique ne change qu'avec les données correspondantes. */
interface HeldPerformance {
  grouping: PerformanceGrouping;
  series: PerformanceSeries;
}

/**
 * État de la carte « Vos performances ». Elle partage la réponse `/stats/dashboard` du bandeau d'indicateurs
 * (une seule requête par période). Le regroupement et la série sont gardés ensemble pendant un rechargement :
 * la carte ne change de forme (courbe ou barres) qu'à l'arrivée des données de la nouvelle temporalité.
 */
@Injectable()
export class PerformanceState {
  private readonly kpis = inject(DashboardKpisState);
  private readonly dashboard = inject(DashboardState);

  /** Regroupement attendu pour la temporalité choisie, sans attendre les données. */
  private readonly requestedGrouping = computed<PerformanceGrouping>(() =>
    this.dashboard.granularity() === 'month' ? 'week' : 'day',
  );

  private readonly held: Signal<HeldPerformance | undefined> = keepLast(
    () => this.kpis.raw(),
    (api) => {
      const grouping = this.requestedGrouping();
      return {
        grouping,
        series: grouping === 'week' ? toWeeklySeries(api) : toPerformanceSeries(api),
      };
    },
  );

  /** Regroupement affiché (celui des données à l'écran). */
  readonly grouping = computed<PerformanceGrouping>(() => this.held()?.grouping ?? 'day');

  readonly series = computed<PerformanceSeries | undefined>(() => this.held()?.series);

  readonly isLoading = computed(() => this.kpis.isLoading());

  readonly error = computed(() => this.kpis.error());

  reload(): void {
    this.kpis.reload();
  }
}
