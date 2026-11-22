import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';

/** Téléchargement du bilan JSON d'une séance avec son activité réalisée (`GET /api/exports/sessions/:id`). */
@Injectable({ providedIn: 'root' })
export class SessionExportApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Fichier reçu tel quel. Les erreurs remontent et sont normalisées par l'intercepteur HTTP. */
  download(sessionId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/exports/sessions/${encodeURIComponent(sessionId)}`, {
      responseType: 'blob',
    });
  }
}
