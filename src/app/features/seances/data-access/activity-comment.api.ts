import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { ActivityCommentApi } from '../models/activity-comment.api-model';

/** Accès HTTP au commentaire d'une activité. Les erreurs remontent et sont normalisées par l'état. */
@Injectable({ providedIn: 'root' })
export class ActivityCommentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Commentaire stocké, sans appel au modèle. 404 si l'activité n'en a pas. */
  get(activityId: string): Observable<ActivityCommentApi> {
    return this.http.get<ActivityCommentApi>(
      `${this.baseUrl}/activities/${encodeURIComponent(activityId)}/comment`,
    );
  }

  /** Remplace le commentaire par un texte saisi à la main. */
  save(activityId: string, text: string): Observable<ActivityCommentApi> {
    return this.http.put<ActivityCommentApi>(
      `${this.baseUrl}/activities/${encodeURIComponent(activityId)}/comment`,
      { text },
    );
  }
}
