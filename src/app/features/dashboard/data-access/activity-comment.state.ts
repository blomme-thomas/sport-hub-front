import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { ActivityComment } from '../models/activity-comment.model';
import { ActivityCommentApiService } from './activity-comment.api';

const NOT_FOUND = 404;

/**
 * Commentaire de l'activité ouverte dans la modale. Une activité sans commentaire (404) est un état normal
 * qui propose de le générer, pas une erreur. Génération et régénération passent par `generate()`.
 * Fourni au niveau de la modale ; une réponse périmée (autre activité) est ignorée.
 */
@Injectable()
export class ActivityCommentState {
  private readonly api = inject(ActivityCommentApiService);
  private readonly activityId = signal<string | undefined>(undefined);
  private readonly generatingValue = signal(false);
  private readonly actionErrorValue = signal<AppError | null>(null);

  private readonly response = resource<ActivityComment | null, string | undefined>({
    params: () => this.activityId(),
    loader: async ({ params: id }) => {
      if (id === undefined) {
        return null;
      }
      try {
        return await firstValueFrom(this.api.get(id));
      } catch (error) {
        if (asAppError(error).status === NOT_FOUND) {
          return null;
        }
        throw error;
      }
    },
  });

  /** Commentaire stocké, `null` s'il n'y en a pas encore ou s'il n'est pas chargé. */
  readonly comment = computed<ActivityComment | null>(() =>
    this.response.hasValue() ? (this.response.value() ?? null) : null,
  );
  readonly loading = computed(() => this.response.isLoading());
  readonly generating = this.generatingValue.asReadonly();
  /** Message d'erreur du chargement ou de la dernière génération, `null` sinon. */
  readonly errorMessage = computed<string | null>(() => {
    const loadFailure = this.response.error();
    const failure =
      this.actionErrorValue() ?? (loadFailure === undefined ? null : asAppError(loadFailure));
    return failure?.userMessage ?? null;
  });

  /** Ouvre le commentaire d'une activité et le charge. */
  select(activityId: string): void {
    this.actionErrorValue.set(null);
    this.activityId.set(activityId);
  }

  reload(): void {
    this.actionErrorValue.set(null);
    this.response.reload();
  }

  /** Génère le commentaire de l'activité ouverte, ou le remplace. */
  async generate(): Promise<void> {
    const id = this.activityId();
    if (id === undefined) {
      return;
    }
    this.generatingValue.set(true);
    this.actionErrorValue.set(null);
    try {
      const comment = await firstValueFrom(this.api.generate(id));
      if (id === this.activityId()) {
        this.response.set(comment);
      }
    } catch (error) {
      if (id === this.activityId()) {
        this.actionErrorValue.set(asAppError(error));
      }
    } finally {
      this.generatingValue.set(false);
    }
  }
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}
