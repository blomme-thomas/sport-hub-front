import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { CompletionOccurrence } from './completion.mapper';

interface SessionOccurrencesResponseApi {
  items: { date: string; status: string }[];
}

/** Occurrences de séances de la plage, tous statuts confondus (`GET /api/sessions`), pour la complétion. */
@Injectable({ providedIn: 'root' })
export class CompletionApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(from: string, to: string): Observable<CompletionOccurrence[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http
      .get<SessionOccurrencesResponseApi>(`${this.baseUrl}/sessions`, { params })
      .pipe(
        map((response) => response.items.map((item) => ({ date: item.date, status: item.status }))),
      );
  }
}
