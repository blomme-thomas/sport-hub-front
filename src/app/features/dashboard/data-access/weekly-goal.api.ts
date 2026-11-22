import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { WeeklyGoalApi } from '../models/weekly-goal.api-model';

/** Accès HTTP à la cible hebdomadaire ; les erreurs remontent telles quelles et sont normalisées par l'état. */
@Injectable({ providedIn: 'root' })
export class WeeklyGoalApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Cible et réalisé de la semaine ISO demandée (`AAAA-Www`). */
  get(week: string): Observable<WeeklyGoalApi> {
    return this.http.get<WeeklyGoalApi>(
      `${this.baseUrl}/settings/weekly-target/${encodeURIComponent(week)}`,
    );
  }
}
