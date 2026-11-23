import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { CreatePlannedMealRequestApi, PlannedMealApi } from '../models/planned-meal.api-model';
import type { PlannedMeal } from '../models/planned-meal.model';
import { toPlannedMeal } from './meal-plan.mapper';

/** Accès HTTP aux repas planifiés ; les réponses sont mappées en modèle UI, les erreurs remontent telles quelles. */
@Injectable({ providedIn: 'root' })
export class MealPlanApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Repas planifiés d'une semaine ISO (`AAAA-Www`), du lundi au dimanche. */
  list(week: string): Observable<PlannedMeal[]> {
    const params = new HttpParams({ fromObject: { week } });
    return this.http
      .get<PlannedMealApi[]>(`${this.baseUrl}/meal-plan`, { params })
      .pipe(map((items) => items.map(toPlannedMeal)));
  }

  create(body: CreatePlannedMealRequestApi): Observable<PlannedMeal> {
    return this.http
      .post<PlannedMealApi>(`${this.baseUrl}/meal-plan`, body)
      .pipe(map(toPlannedMeal));
  }

  delete(id: string): Observable<null> {
    return this.http.delete<null>(`${this.baseUrl}/meal-plan/${encodeURIComponent(id)}`);
  }
}
