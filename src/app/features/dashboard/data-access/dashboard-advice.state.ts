import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { DashboardAdvice } from '../models/dashboard-advice.model';
import { DashboardAdviceApiService } from './dashboard-advice.api';

const NOT_FOUND = 404;

/**
 * Conseil du tableau de bord : lecture du conseil stocké (404 = pas encore de conseil, état normal qui
 * propose de le générer), puis génération ou régénération à la demande. Fourni au niveau de la page.
 */
@Injectable()
export class DashboardAdviceState {
  private readonly api = inject(DashboardAdviceApiService);
  private readonly generatingValue = signal(false);
  private readonly actionErrorValue = signal<AppError | null>(null);

  private readonly response = resource<DashboardAdvice | null, void>({
    loader: async () => {
      try {
        return await firstValueFrom(this.api.get());
      } catch (error) {
        if (asAppError(error).status === NOT_FOUND) {
          return null;
        }
        throw error;
      }
    },
  });

  /** Conseil stocké, `null` s'il n'y en a pas encore ou s'il n'est pas chargé. */
  readonly advice = computed<DashboardAdvice | null>(() =>
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

  reload(): void {
    this.actionErrorValue.set(null);
    this.response.reload();
  }

  /** Génère le conseil de la semaine courante, ou le remplace. */
  async generate(): Promise<void> {
    this.generatingValue.set(true);
    this.actionErrorValue.set(null);
    try {
      this.response.set(await firstValueFrom(this.api.regenerate()));
    } catch (error) {
      this.actionErrorValue.set(asAppError(error));
    } finally {
      this.generatingValue.set(false);
    }
  }
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}
