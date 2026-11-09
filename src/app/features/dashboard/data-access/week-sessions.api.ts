import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { WeekMiniSession } from '../models/week-mini-calendar.model';

interface SessionOccurrenceApi {
  sessionId: string;
  date: string;
  startTime: string | null;
  disciplineTypeKey: string;
  status: string;
}

interface SessionOccurrencesResponseApi {
  items: SessionOccurrenceApi[];
}

interface DisciplineApi {
  typeKey: string;
  label: string;
}

interface DisciplineListResponseApi {
  items: DisciplineApi[];
}

/** Séances et disciplines du mini-calendrier ; les erreurs remontent telles quelles (`AppError` via l'intercepteur). */
@Injectable({ providedIn: 'root' })
export class WeekSessionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Séances planifiées de la période `from`–`to`. Les séances réalisées, manquées ou annulées ne sont pas affichées. */
  list(from: string, to: string): Observable<WeekMiniSession[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http
      .get<SessionOccurrencesResponseApi>(`${this.baseUrl}/sessions`, { params })
      .pipe(
        map((response) =>
          response.items
            .filter((item) => item.status === 'planifiee')
            .map((item) => ({
              id: item.sessionId,
              date: item.date,
              startTime: item.startTime,
              disciplineTypeKey: item.disciplineTypeKey,
            })),
        ),
      );
  }

  /** Libellés des disciplines du référentiel, par clé. */
  disciplineLabels(): Observable<ReadonlyMap<string, string>> {
    return this.http
      .get<DisciplineListResponseApi>(`${this.baseUrl}/disciplines`)
      .pipe(map((response) => new Map(response.items.map((item) => [item.typeKey, item.label]))));
  }
}
