import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { localIsoDate } from '../../../shared/utils/iso-date';
import { isoWeekOf } from '../../../shared/utils/iso-week';
import type { WeeklyGoalView } from '../models/weekly-goal.model';
import { WeeklyGoalApiService } from './weekly-goal.api';
import { toWeeklyGoalView } from './weekly-goal.mapper';

/**
 * État de la carte « Objectif de la semaine » : semaine ISO courante, vue dérivée de la réponse. Sans objectif,
 * la vue indique l'absence de cible (la carte propose de la définir). Fourni au niveau de la page.
 */
@Injectable()
export class WeeklyGoalState {
  private readonly api = inject(WeeklyGoalApiService);
  private readonly viewValue = signal<WeeklyGoalView | null>(null);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);
  private latestRequest = 0;

  readonly view = this.viewValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly errorMessage = computed(() => this.errorValue()?.userMessage ?? null);

  constructor() {
    void this.load();
  }

  reload(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const request = ++this.latestRequest;
    const week = isoWeekOf(localIsoDate());
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      const view = toWeeklyGoalView(await firstValueFrom(this.api.get(week)));
      if (request === this.latestRequest) {
        this.viewValue.set(view);
      }
    } catch (error) {
      if (request === this.latestRequest) {
        this.errorValue.set(error instanceof AppError ? error : toAppError(error));
      }
    } finally {
      if (request === this.latestRequest) {
        this.loadingValue.set(false);
      }
    }
  }
}
