import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { addIsoDays, localIsoDate } from '../../../shared/utils/iso-date';
import { isoWeekOf, mondayOfIsoWeek, shiftIsoWeek } from '../../../shared/utils/iso-week';
import type { WeeklyReview } from '../models/weekly-review.model';
import { WeeklyReviewApiService } from './weekly-review.api';

const NOT_FOUND = 404;

/**
 * État du bilan hebdomadaire : semaine affichée, bilan stocké, génération. Une semaine sans bilan
 * (404) est un état normal qui propose de le générer, pas une erreur. Une réponse périmée est ignorée.
 * Fourni au niveau de la page pour charger en parallèle du reste du tableau de bord.
 */
@Injectable()
export class WeeklyReviewState {
  private readonly api = inject(WeeklyReviewApiService);
  private readonly weekValue = signal(isoWeekOf(localIsoDate()));
  private readonly reviewValue = signal<WeeklyReview | null>(null);
  private readonly loadingValue = signal(false);
  private readonly generatingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);
  private latestRequest = 0;

  readonly week = this.weekValue.asReadonly();
  readonly weekLabel = computed(() => formatWeek(this.weekValue()));
  readonly review = this.reviewValue.asReadonly();
  /** Vrai quand la semaine n'a pas de bilan stocké : la carte propose de le générer. */
  readonly missing = computed(
    () => !this.loadingValue() && this.reviewValue() === null && this.errorValue() === null,
  );
  readonly isLoading = this.loadingValue.asReadonly();
  readonly generating = this.generatingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();

  constructor() {
    this.reload();
  }

  reload(): void {
    void this.load();
  }

  previousWeek(): void {
    this.moveTo(shiftIsoWeek(this.weekValue(), -1));
  }

  nextWeek(): void {
    this.moveTo(shiftIsoWeek(this.weekValue(), 1));
  }

  currentWeek(): void {
    this.moveTo(isoWeekOf(localIsoDate()));
  }

  /** Génère le bilan de la semaine affichée, ou le remplace. */
  async generate(): Promise<void> {
    const week = this.weekValue();
    this.generatingValue.set(true);
    this.errorValue.set(null);
    try {
      const review = await firstValueFrom(this.api.generate(week));
      if (week === this.weekValue()) {
        this.reviewValue.set(review);
      }
    } catch (error) {
      this.errorValue.set(asAppError(error));
    } finally {
      this.generatingValue.set(false);
    }
  }

  private moveTo(week: string): void {
    this.weekValue.set(week);
    this.reviewValue.set(null);
    this.reload();
  }

  private async load(): Promise<void> {
    const request = ++this.latestRequest;
    const week = this.weekValue();
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      const review = await firstValueFrom(this.api.get(week));
      if (request === this.latestRequest) {
        this.reviewValue.set(review);
      }
    } catch (error) {
      if (request !== this.latestRequest) {
        return;
      }
      const appError = asAppError(error);
      if (appError.status === NOT_FOUND) {
        this.reviewValue.set(null);
      } else {
        this.errorValue.set(appError);
      }
    } finally {
      if (request === this.latestRequest) {
        this.loadingValue.set(false);
      }
    }
  }
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}

/** Libellé de la semaine : « Semaine du 9 au 15 novembre 2026 ». */
function formatWeek(week: string): string {
  const monday = mondayOfIsoWeek(week);
  const sunday = addIsoDays(monday, 6);
  const format = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `Semaine du ${format.format(new Date(`${monday}T00:00:00Z`))} au ${format.format(new Date(`${sunday}T00:00:00Z`))}`;
}
