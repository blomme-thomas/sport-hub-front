import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { ReplaceSessionModulesRequestApi, SessionApi } from '../models/session.api-model';

/** Accès HTTP aux séances ; les erreurs remontent telles quelles et sont normalisées par l'état. */
@Injectable({ providedIn: 'root' })
export class SessionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(id: string): Observable<SessionApi> {
    return this.http.get<SessionApi>(`${this.baseUrl}/sessions/${encodeURIComponent(id)}`);
  }

  /** Remplace la liste ordonnée des modules ; renvoie la séance mise à jour. */
  replaceModules(id: string, body: ReplaceSessionModulesRequestApi): Observable<SessionApi> {
    return this.http.put<SessionApi>(
      `${this.baseUrl}/sessions/${encodeURIComponent(id)}/modules`,
      body,
    );
  }
}
