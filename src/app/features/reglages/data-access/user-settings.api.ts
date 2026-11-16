import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { UserSettingsApi } from '../models/user-settings.api-model';

/** Accès HTTP aux réglages ; les erreurs remontent telles quelles et sont normalisées par l'état. */
@Injectable({ providedIn: 'root' })
export class UserSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(): Observable<UserSettingsApi> {
    return this.http.get<UserSettingsApi>(`${this.baseUrl}/settings`);
  }

  /** Enregistre la cible hebdomadaire (secondes), ou la retire avec null. */
  save(weeklyTargetSeconds: number | null): Observable<UserSettingsApi> {
    return this.http.put<UserSettingsApi>(`${this.baseUrl}/settings`, { weeklyTargetSeconds });
  }
}
