import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { Pause, PauseInput } from '../models/pause.model';

/** Accès HTTP aux pauses ; les erreurs remontent telles quelles (`AppError` via l'intercepteur). */
@Injectable({ providedIn: 'root' })
export class PausesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Pauses qui chevauchent la période `from`–`to` (bornes incluses). */
  list(from: string, to: string): Observable<Pause[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<Pause[]>(`${this.baseUrl}/pauses`, { params });
  }

  create(body: PauseInput): Observable<Pause> {
    return this.http.post<Pause>(`${this.baseUrl}/pauses`, body);
  }

  update(id: string, body: Partial<PauseInput>): Observable<Pause> {
    return this.http.patch<Pause>(`${this.baseUrl}/pauses/${encodeURIComponent(id)}`, body);
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/pauses/${encodeURIComponent(id)}`);
  }
}
