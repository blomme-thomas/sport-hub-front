import { Injectable, Signal, computed, inject, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';
import type { DashboardKpi } from '../models/dashboard-kpi.model';
import { DashboardKpisApi } from './dashboard-kpis.api';
import { toDashboardKpis } from './dashboard-kpis.mapper';

/** Période du bandeau. Fixée à 7 jours tant que le sélecteur de période (story #24) n'est pas livré. */
const PERIOD = '7d';

/**
 * État du bandeau d'indicateurs. `kpis` vaut `undefined` tant que la réponse n'est pas reçue.
 * Fourni au niveau de la page, séparément de `DashboardState` pour que les erreurs restent indépendantes.
 */
@Injectable()
export class DashboardKpisState {
  private readonly api = inject(DashboardKpisApi);

  private readonly response = resource<DashboardKpisResponseApi, void>({
    loader: () => firstValueFrom(this.api.get(PERIOD)),
  });

  readonly kpis: Signal<DashboardKpi[] | undefined> = computed(() =>
    this.response.hasValue() ? toDashboardKpis(this.response.value()) : undefined,
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
