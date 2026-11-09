import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { DisciplineListResponseApi } from '../models/session-occurrence.api-model';

/** Libellé par clé de discipline, pour la légende du calendrier. */
@Injectable({ providedIn: 'root' })
export class DisciplinesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<Map<string, string>> {
    return this.http
      .get<DisciplineListResponseApi>(`${this.baseUrl}/disciplines`)
      .pipe(map((response) => new Map(response.items.map((item) => [item.typeKey, item.label]))));
  }
}
