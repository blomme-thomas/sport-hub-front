import { Injectable, Signal, computed, inject, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';
import type { DashboardKpi } from '../models/dashboard-kpi.model';
import { DashboardKpisApi } from './dashboard-kpis.api';
import { DashboardState } from './dashboard.state';
import { keepLast } from './hold-last';
import { type MetricsPeriod, metricsPeriodFor } from './metrics-period';
import { toDashboardKpis } from './dashboard-kpis.mapper';

/**
 * État du bandeau d'indicateurs. Sa période suit la temporalité choisie en haut à droite (voir `metricsPeriodFor`).
 * `kpis` vaut `undefined` tant que la réponse n'est pas reçue.
 * Fourni au niveau de la page, séparément de `DashboardState` pour que les erreurs restent indépendantes.
 */
@Injectable()
export class DashboardKpisState {
  private readonly api = inject(DashboardKpisApi);
  private readonly dashboard = inject(DashboardState);

  private readonly response = resource<DashboardKpisResponseApi, MetricsPeriod>({
    params: () => metricsPeriodFor(this.dashboard.granularity()),
    loader: ({ params }) => firstValueFrom(this.api.get(params)),
  });

  /** Réponse brute, partagée avec « Vos performances » pour ne pas la demander deux fois. */
  readonly raw: Signal<DashboardKpisResponseApi | undefined> = keepLast(
    () => (this.response.hasValue() ? this.response.value() : undefined),
    (response) => response,
  );

  /** Indicateurs ; gardés pendant un rechargement pour éviter un affichage vide. */
  readonly kpis: Signal<DashboardKpi[] | undefined> = keepLast(
    () => (this.response.hasValue() ? this.response.value() : undefined),
    toDashboardKpis,
  );

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
