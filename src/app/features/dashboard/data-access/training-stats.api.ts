import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { TrainingStatsResponseApi } from '../models/training-stats.api-model';
import type { Granularity } from '../models/training-stats.model';

export interface TrainingStatsQuery {
  granularity: Granularity;
  from: string;
  to: string;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class TrainingStatsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Renvoie la réponse de `GET /api/stats` telle quelle, sans transformation. */
  get(query: TrainingStatsQuery): Observable<TrainingStatsResponseApi> {
    return this.http.get<TrainingStatsResponseApi>(`${this.baseUrl}/stats`, {
      params: {
        granularity: query.granularity,
        from: query.from,
        to: query.to,
        ...(query.type && { type: query.type }),
      },
    });
  }
}
