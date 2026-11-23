import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';

/** Séance planifiée à venir, telle que la carte « Séances programmées » l'affiche. */
export interface UpcomingSession {
  id: string;
  /** Date `YYYY-MM-DD`. */
  date: string;
  /** Heure de début `HH:mm`, obligatoire. */
  startTime: string;
  durationMinutes: number;
  title: string | null;
  disciplineTypeKey: string;
}

interface SessionOccurrenceApi {
  sessionId: string;
  title: string | null;
  date: string;
  startTime: string;
  durationMinutes: number;
  disciplineTypeKey: string;
  status: string;
}

interface SessionOccurrencesResponseApi {
  items: SessionOccurrenceApi[];
}

/**
 * Séances planifiées d'une période, pour la carte « Séances programmées ». Seules les séances `planifiee` sont gardées ;
 * les erreurs remontent telles quelles (`AppError` via l'intercepteur).
 */
@Injectable({ providedIn: 'root' })
export class UpcomingSessionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(from: string, to: string): Observable<UpcomingSession[]> {
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
              durationMinutes: item.durationMinutes,
              title: item.title,
              disciplineTypeKey: item.disciplineTypeKey,
            })),
        ),
      );
  }
}
