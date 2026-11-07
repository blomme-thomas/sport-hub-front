import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type {
  CreateGoalRequestApi,
  GoalApi,
  GoalListResponseApi,
  UpdateGoalRequestApi,
} from '../models/goal.api-model';
import type { Goal } from '../models/goal.model';
import { toGoal } from './goal.mapper';

/** Accès HTTP aux objectifs ; les réponses sont mappées en modèle UI, les erreurs remontent telles quelles. */
@Injectable({ providedIn: 'root' })
export class GoalsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<Goal[]> {
    return this.http
      .get<GoalListResponseApi>(`${this.baseUrl}/goals`)
      .pipe(map((response) => response.items.map(toGoal)));
  }

  create(body: CreateGoalRequestApi): Observable<Goal> {
    return this.http.post<GoalApi>(`${this.baseUrl}/goals`, body).pipe(map(toGoal));
  }

  update(id: string, body: UpdateGoalRequestApi): Observable<Goal> {
    return this.http
      .patch<GoalApi>(`${this.baseUrl}/goals/${encodeURIComponent(id)}`, body)
      .pipe(map(toGoal));
  }

  delete(id: string): Observable<null> {
    return this.http.delete<null>(`${this.baseUrl}/goals/${encodeURIComponent(id)}`);
  }
}
