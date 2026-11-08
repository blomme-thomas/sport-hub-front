import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';

/** Lecture des indicateurs du tableau de bord : `GET /api/stats/dashboard?period=…`. */
@Injectable({ providedIn: 'root' })
export class DashboardKpisApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(period: string): Observable<DashboardKpisResponseApi> {
    return this.http.get<DashboardKpisResponseApi>(`${this.baseUrl}/stats/dashboard`, {
      params: new HttpParams().set('period', period),
    });
  }
}
