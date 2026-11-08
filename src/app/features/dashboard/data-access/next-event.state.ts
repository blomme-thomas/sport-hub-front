import { Injectable, Signal, computed, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { NextEventGoalApi } from '../models/next-event.api-model';
import type { NextEvent } from '../models/next-event.model';
import { NextEventApi } from './next-event.api';
import { toNextEvent } from './next-event.mapper';

/**
 * État du bloc « Prochain événement » : prochain événement à venir, ou `null` s'il n'y en a aucun.
 * `event` vaut `undefined` tant que la liste n'est pas chargée. Le jour de référence est figé à la création, en UTC.
 * Fourni au niveau de la page, séparément de `DashboardState` pour que les erreurs restent indépendantes.
 */
@Injectable()
export class NextEventState {
  private readonly api = inject(NextEventApi);

  readonly today: Signal<string> = signal(new Date().toISOString().slice(0, 10)).asReadonly();

  private readonly goals = resource<NextEventGoalApi[], void>({
    loader: () => firstValueFrom(this.api.list()),
  });

  readonly event = computed<NextEvent | null | undefined>(() => {
    if (!this.goals.hasValue()) {
      return undefined;
    }
    return toNextEvent(this.goals.value(), this.today());
  });

  readonly isLoading = computed(() => this.goals.isLoading());

  readonly error = computed<AppError | null>(() => {
    const error = this.goals.error();
    if (error === undefined) {
      return null;
    }
    return error instanceof AppError ? error : toAppError(error);
  });

  reload(): void {
    this.goals.reload();
  }
}
