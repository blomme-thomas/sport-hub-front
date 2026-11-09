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

  /** Déplace une seule occurrence d'une série. `date` est la date de programmation de l'occurrence. */
  moveOccurrence(
    id: string,
    date: string,
    body: { date: string; startTime: string },
  ): Observable<unknown> {
    return this.http.put(
      `${this.baseUrl}/sessions/${encodeURIComponent(id)}/occurrences/${date}`,
      body,
    );
  }

  /** Annule une seule occurrence (elle reste listée, avec le statut annulée). */
  cancelOccurrence(id: string, date: string): Observable<unknown> {
    return this.http.post(
      `${this.baseUrl}/sessions/${encodeURIComponent(id)}/occurrences/${date}/cancel`,
      null,
    );
  }

  /** Restaure une occurrence à sa programmation initiale. */
  restoreOccurrence(id: string, date: string): Observable<unknown> {
    return this.http.delete(
      `${this.baseUrl}/sessions/${encodeURIComponent(id)}/occurrences/${date}/exception`,
    );
  }

  /** Supprime la séance ; pour une série, supprime toute la série. */
  delete(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/sessions/${encodeURIComponent(id)}`);
  }

  /** Déplace une séance (nouveau jour et heure de début) ; pour une série, déplace toute la série. */
  move(id: string, body: { date: string; startTime: string }): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/sessions/${encodeURIComponent(id)}`, body);
  }

  /** Change la durée d'une séance ; pour une série, change la durée de toute la série. */
  updateDuration(id: string, durationMinutes: number): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/sessions/${encodeURIComponent(id)}`, {
      durationMinutes,
    });
  }
}
