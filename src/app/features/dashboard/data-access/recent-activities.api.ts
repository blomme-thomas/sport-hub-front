import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { ActivitySummaryApi, ActivityListApi } from '../models/recent-activity.api-model';

/** Lecture des dernières séances pour le tableau de bord : `GET /api/activities`, de la plus récente à la plus ancienne. */
@Injectable({ providedIn: 'root' })
export class RecentActivitiesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(pageSize: number): Observable<ActivitySummaryApi[]> {
    return this.http
      .get<ActivityListApi>(`${this.baseUrl}/activities`, {
        params: { pageSize: String(pageSize) },
      })
      .pipe(map((response) => response.items));
  }
}
