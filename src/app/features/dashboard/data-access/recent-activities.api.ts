import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type {
  ActivityDetailApi,
  ActivityListApi,
  ActivitySummaryApi,
} from '../models/recent-activity.api-model';

/** Lecture des activités pour le tableau de bord : liste (`GET /api/activities`) et détail (`GET /api/activities/:id`). */
@Injectable({ providedIn: 'root' })
export class RecentActivitiesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Dernières activités, de la plus récente à la plus ancienne. */
  list(pageSize: number): Observable<ActivitySummaryApi[]> {
    return this.http
      .get<ActivityListApi>(`${this.baseUrl}/activities`, {
        params: { pageSize: String(pageSize) },
      })
      .pipe(map((response) => response.items));
  }

  /** Toutes les métriques d'une activité, dont la série de fréquence cardiaque. */
  detail(id: string): Observable<ActivityDetailApi> {
    return this.http.get<ActivityDetailApi>(`${this.baseUrl}/activities/${encodeURIComponent(id)}`);
  }
}
