import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { ShoppingListItemApi } from '../models/shopping-list.api-model';
import type { DateRange, ShoppingListItem } from '../models/shopping-list.model';

/** Accès HTTP à la liste de courses d'une période ; les erreurs remontent telles quelles. */
@Injectable({ providedIn: 'root' })
export class ShoppingListApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Liste calculée par le back pour la période (bornes incluses), triée par catégorie puis par nom. */
  get(range: DateRange): Observable<ShoppingListItem[]> {
    const params = new HttpParams({ fromObject: { from: range.from, to: range.to } });
    return this.http
      .get<ShoppingListItemApi[]>(`${this.baseUrl}/shopping-list`, { params })
      .pipe(map((items) => items.map((item) => ({ ...item }))));
  }
}
