import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type {
  SessionOccurrenceApi,
  SessionOccurrencesResponseApi,
} from '../models/session-occurrence.api-model';
import type { SessionOccurrence } from '../models/session-occurrence.model';

/**
 * Lecture des séances pour le calendrier : occurrences d'une période. Les séances sans heure sont écartées,
 * car elles ne peuvent pas être placées sur la grille.
 */
@Injectable({ providedIn: 'root' })
export class SessionOccurrencesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(from: string, to: string): Observable<SessionOccurrence[]> {
    const params = new HttpParams({ fromObject: { from, to } });
    return this.http
      .get<SessionOccurrencesResponseApi>(`${this.baseUrl}/sessions`, { params })
      .pipe(map((response) => response.items.flatMap(toOccurrence)));
  }
}

function toOccurrence(api: SessionOccurrenceApi): SessionOccurrence[] {
  if (api.startTime === null) {
    return [];
  }
  return [
    {
      id: api.sessionId,
      date: api.date,
      startTime: api.startTime,
      durationMinutes: api.durationMinutes,
      disciplineTypeKey: api.disciplineTypeKey,
      recurrence: api.recurrence,
      status: api.status,
    },
  ];
}
