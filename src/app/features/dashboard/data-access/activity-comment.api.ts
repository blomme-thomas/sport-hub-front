import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { ActivityCommentApi } from '../models/activity-comment.api-model';
import type { ActivityComment } from '../models/activity-comment.model';
import { toActivityComment } from './activity-comment.mapper';

/** Accès HTTP au commentaire d'une activité ; les erreurs remontent telles quelles et sont normalisées par l'état. */
@Injectable({ providedIn: 'root' })
export class ActivityCommentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Commentaire stocké, sans appel au modèle. 404 si l'activité n'en a pas encore. */
  get(activityId: string): Observable<ActivityComment> {
    return this.http
      .get<ActivityCommentApi>(
        `${this.baseUrl}/activities/${encodeURIComponent(activityId)}/comment`,
      )
      .pipe(map(toActivityComment));
  }

  /** Génère le commentaire, ou le remplace s'il existe. */
  generate(activityId: string): Observable<ActivityComment> {
    return this.http
      .post<ActivityCommentApi>(
        `${this.baseUrl}/activities/${encodeURIComponent(activityId)}/comment`,
        null,
      )
      .pipe(map(toActivityComment));
  }
}
