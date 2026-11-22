import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type {
  SessionActivityApi,
  SessionActivityListApi,
} from '../models/session-activity.api-model';

/** Lecture des activités pour la fiche de séance : celles d'un jour, et le détail d'une activité liée. */
@Injectable({ providedIn: 'root' })
export class SessionActivitiesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Activités du jour (UTC) de `date` (YYYY-MM-DD), de la plus ancienne à la plus récente. */
  listForDay(date: string): Observable<SessionActivityApi[]> {
    return this.http
      .get<SessionActivityListApi>(`${this.baseUrl}/activities`, {
        params: {
          from: `${date}T00:00:00.000Z`,
          to: `${date}T23:59:59.999Z`,
          pageSize: '100',
        },
      })
      .pipe(map((response) => response.items));
  }

  detail(id: string): Observable<SessionActivityApi> {
    return this.http.get<SessionActivityApi>(
      `${this.baseUrl}/activities/${encodeURIComponent(id)}`,
    );
  }
}
