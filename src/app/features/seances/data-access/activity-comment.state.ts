import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { ActivityCommentApi } from '../models/activity-comment.api-model';
import { ActivityCommentApiService } from './activity-comment.api';
import { SessionState } from './session.state';

const NOT_FOUND = 404;

/** L'intercepteur HTTP renvoie déjà une `AppError` : elle est reprise telle quelle. */
function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}

/**
 * Commentaire de l'activité réalisée liée à la séance affichée : lecture, édition et enregistrement.
 * Fourni au niveau de la fiche. Le brouillon reste en mémoire si l'enregistrement échoue.
 */
@Injectable()
export class ActivityCommentState {
  private readonly api = inject(ActivityCommentApiService);
  private readonly session = inject(SessionState);

  private readonly editingValue = signal(false);
  private readonly draftValue = signal('');
  private readonly savingValue = signal(false);
  private readonly saveErrorValue = signal<AppError | null>(null);

  private readonly linkedActivityId = computed(
    () => this.session.session()?.linkedActivity?.id ?? undefined,
  );

  private readonly commentResource = resource<ActivityCommentApi | null, string | undefined>({
    params: () => this.linkedActivityId(),
    loader: async ({ params }) => {
      try {
        return await firstValueFrom(this.api.get(params));
      } catch (failure: unknown) {
        // Une activité sans commentaire (404) est un état normal, pas une erreur.
        if (asAppError(failure).status === NOT_FOUND) {
          return null;
        }
        throw failure;
      }
    },
  });

  /** Commentaire stocké, `null` s'il n'en existe pas encore. */
  readonly comment = computed<ActivityCommentApi | null>(() =>
    this.commentResource.hasValue() ? this.commentResource.value() : null,
  );
  readonly isLoading = computed(() => this.commentResource.isLoading());
  readonly error = computed<AppError | null>(() => {
    const failure = this.commentResource.error();
    return failure === undefined ? null : asAppError(failure);
  });

  readonly editing = this.editingValue.asReadonly();
  readonly draft = this.draftValue.asReadonly();
  readonly saving = this.savingValue.asReadonly();
  readonly saveError = this.saveErrorValue.asReadonly();
  readonly canSave = computed(() => this.draftValue().trim().length > 0 && !this.savingValue());

  startEdit(): void {
    this.draftValue.set(this.comment()?.text ?? '');
    this.saveErrorValue.set(null);
    this.editingValue.set(true);
  }

  setDraft(text: string): void {
    this.draftValue.set(text);
  }

  cancel(): void {
    this.editingValue.set(false);
    this.saveErrorValue.set(null);
  }

  /** Enregistre le brouillon. Renvoie `true` si le commentaire a été remplacé. */
  async save(): Promise<boolean> {
    const activityId = this.linkedActivityId();
    if (activityId === undefined || !this.canSave()) {
      return false;
    }
    this.savingValue.set(true);
    this.saveErrorValue.set(null);
    try {
      const saved = await firstValueFrom(this.api.save(activityId, this.draftValue()));
      this.commentResource.set(saved);
      this.editingValue.set(false);
      return true;
    } catch (failure: unknown) {
      this.saveErrorValue.set(asAppError(failure));
      return false;
    } finally {
      this.savingValue.set(false);
    }
  }
}
