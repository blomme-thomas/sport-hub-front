import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { DashboardAdviceApi } from '../models/dashboard-advice.api-model';
import type { DashboardAdvice } from '../models/dashboard-advice.model';
import { toDashboardAdvice } from './dashboard-advice.mapper';

/** Accès HTTP au conseil du tableau de bord ; les erreurs remontent telles quelles et sont normalisées par l'état. */
@Injectable({ providedIn: 'root' })
export class DashboardAdviceApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Conseil stocké de la semaine courante, sans appel au modèle. 404 s'il n'existe pas encore. */
  get(): Observable<DashboardAdvice> {
    return this.http
      .get<DashboardAdviceApi>(`${this.baseUrl}/advice/dashboard`)
      .pipe(map(toDashboardAdvice));
  }

  /** Génère le conseil de la semaine courante, ou le remplace. */
  regenerate(): Observable<DashboardAdvice> {
    return this.http
      .post<DashboardAdviceApi>(`${this.baseUrl}/advice/dashboard/regenerate`, null)
      .pipe(map(toDashboardAdvice));
  }
}
