import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { FoodApi, FoodRequestApi } from '../models/food.api-model';
import type { Food } from '../models/food.model';
import { toFood } from './food.mapper';

/** Accès HTTP à la base d'aliments ; les réponses sont mappées en modèle UI, les erreurs remontent telles quelles. */
@Injectable({ providedIn: 'root' })
export class FoodsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Tous les aliments : la recherche et le filtre par catégorie se font à l'écran, sur cette liste. */
  list(): Observable<Food[]> {
    return this.http
      .get<FoodApi[]>(`${this.baseUrl}/foods`)
      .pipe(map((items) => items.map(toFood)));
  }

  create(body: FoodRequestApi): Observable<Food> {
    return this.http.post<FoodApi>(`${this.baseUrl}/foods`, body).pipe(map(toFood));
  }

  update(id: string, body: FoodRequestApi): Observable<Food> {
    return this.http
      .patch<FoodApi>(`${this.baseUrl}/foods/${encodeURIComponent(id)}`, body)
      .pipe(map(toFood));
  }
}
