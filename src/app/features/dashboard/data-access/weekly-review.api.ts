import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { WeeklyReviewApi } from '../models/weekly-review.api-model';
import type { WeeklyReview } from '../models/weekly-review.model';
import { toWeeklyReview } from './weekly-review.mapper';

/** Accès HTTP au bilan hebdomadaire ; les erreurs remontent telles quelles et sont normalisées par l'état. */
@Injectable({ providedIn: 'root' })
export class WeeklyReviewApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Bilan stocké de la semaine, sans appel au modèle. 404 si la semaine n'a pas de bilan. */
  get(week: string): Observable<WeeklyReview> {
    return this.http
      .get<WeeklyReviewApi>(`${this.baseUrl}/weekly-reviews/${encodeURIComponent(week)}`)
      .pipe(map(toWeeklyReview));
  }

  /** Génère le bilan, ou le remplace s'il existe. */
  generate(week: string): Observable<WeeklyReview> {
    return this.http
      .post<WeeklyReviewApi>(`${this.baseUrl}/weekly-reviews/${encodeURIComponent(week)}`, null)
      .pipe(map(toWeeklyReview));
  }
}
