import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';

interface GarminProfileApi {
  displayName: string | null;
}

/** Profil affiché : `GET /api/profile`. Les erreurs remontent telles quelles (`AppError` via l'intercepteur). */
@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Prénom ou nom affiché du compte, ou `null` si Garmin ne le fournit pas. */
  displayName(): Observable<string | null> {
    return this.http
      .get<GarminProfileApi>(`${this.baseUrl}/profile`)
      .pipe(map((profile) => profile.displayName));
  }
}
