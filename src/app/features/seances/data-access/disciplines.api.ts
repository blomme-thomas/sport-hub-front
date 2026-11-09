import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { DisciplineApi, DisciplineListResponseApi } from '../models/session.api-model';

/** Référentiel des disciplines, pour afficher le libellé d'une clé de discipline. */
@Injectable({ providedIn: 'root' })
export class DisciplinesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Libellé par clé de discipline. */
  list(): Observable<Map<string, string>> {
    return this.http
      .get<DisciplineListResponseApi>(`${this.baseUrl}/disciplines`)
      .pipe(map((response) => toLabels(response.items)));
  }
}

function toLabels(items: readonly DisciplineApi[]): Map<string, string> {
  return new Map(items.map((item) => [item.typeKey, item.label]));
}
