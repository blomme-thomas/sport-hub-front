import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type {
  GeneratedPlanningApi,
  GeneratePlanningRequestApi,
  GoalListResponseApi,
} from '../models/planning.api-model';

/** Événement choisissable comme fin de planning : un objectif de type événement avec une date cible. */
export interface EventGoal {
  id: string;
  title: string;
  targetDate: string;
}

/** Génération de planning ; les erreurs remontent telles quelles (`AppError` via l'intercepteur). */
@Injectable({ providedIn: 'root' })
export class PlanningApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  generate(body: GeneratePlanningRequestApi): Observable<GeneratedPlanningApi> {
    return this.http.post<GeneratedPlanningApi>(`${this.baseUrl}/planning/generate`, body);
  }

  /** Objectifs de type événement ayant une date cible, par date croissante. */
  listEvents(): Observable<EventGoal[]> {
    return this.http.get<GoalListResponseApi>(`${this.baseUrl}/goals`).pipe(
      map((response) =>
        response.items
          .filter(
            (goal): goal is typeof goal & { targetDate: string } =>
              goal.type === 'evenement' && goal.targetDate !== null,
          )
          .map((goal) => ({ id: goal.id, title: goal.title, targetDate: goal.targetDate }))
          .sort((a, b) => a.targetDate.localeCompare(b.targetDate)),
      ),
    );
  }
}
