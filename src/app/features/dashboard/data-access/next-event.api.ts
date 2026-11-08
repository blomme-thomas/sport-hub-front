import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { NextEventGoalApi, NextEventGoalsResponseApi } from '../models/next-event.api-model';

/** Lecture minimale de `GET /api/goals` pour le tableau de bord ; la sélection de l'événement se fait dans le mapper. */
@Injectable({ providedIn: 'root' })
export class NextEventApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<NextEventGoalApi[]> {
    return this.http
      .get<NextEventGoalsResponseApi>(`${this.baseUrl}/goals`)
      .pipe(map((response) => response.items));
  }
}
