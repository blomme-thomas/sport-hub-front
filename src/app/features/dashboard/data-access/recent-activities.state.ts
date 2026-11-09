import { Injectable, Signal, computed, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { ActivitySummaryApi } from '../models/recent-activity.api-model';
import type { RecentActivity } from '../models/recent-activity.model';
import { RecentActivitiesApi } from './recent-activities.api';
import { toRecentActivity } from './recent-activities.mapper';

/** Nombre d'activités chargées ; la carte défile au-delà de quatre lignes visibles. */
const PAGE_SIZE = 20;

/**
 * État du bloc « Détails par séance » : les séances les plus récentes (au plus PAGE_SIZE).
 * `activities` vaut `undefined` tant que la liste n'est pas chargée. La date de référence est figée à la création.
 * Fourni au niveau de la page, séparément de `DashboardState` pour que les erreurs restent indépendantes.
 */
@Injectable()
export class RecentActivitiesState {
  private readonly api = inject(RecentActivitiesApi);
  private readonly now = signal(new Date()).asReadonly();

  private readonly items = resource<ActivitySummaryApi[], void>({
    loader: () => firstValueFrom(this.api.list(PAGE_SIZE)),
  });

  readonly activities: Signal<RecentActivity[] | undefined> = computed(() => {
    if (!this.items.hasValue()) {
      return undefined;
    }
    const now = this.now();
    return this.items.value().map((item) => toRecentActivity(item, now));
  });

  readonly isLoading = computed(() => this.items.isLoading());

  readonly error = computed<AppError | null>(() => {
    const error = this.items.error();
    if (error === undefined) {
      return null;
    }
    return error instanceof AppError ? error : toAppError(error);
  });

  reload(): void {
    this.items.reload();
  }
}
