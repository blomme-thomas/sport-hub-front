import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';

/** Corps de `POST /api/sessions` tel que le calendrier l'envoie. */
export interface CreateSessionRequestApi {
  date: string;
  startTime: string;
  disciplineTypeKey: string;
  durationMinutes: number;
  recurrence: 'aucune' | 'hebdomadaire';
  description?: string;
  equipment?: string;
  attentionPoints?: string;
}

/** Écriture des séances depuis le calendrier ; les erreurs remontent telles quelles (`AppError` via l'intercepteur). */
@Injectable({ providedIn: 'root' })
export class SessionsWriteApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Crée la séance et renvoie son identifiant. */
  create(body: CreateSessionRequestApi): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/sessions`, body);
  }
}
