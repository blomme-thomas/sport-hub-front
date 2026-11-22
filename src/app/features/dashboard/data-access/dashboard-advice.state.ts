import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AI_FEATURES } from '../../../core/config/ai-features';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { DashboardAdvice } from '../models/dashboard-advice.model';
import { DashboardAdviceApiService } from './dashboard-advice.api';

const NOT_FOUND = 404;

/**
 * État du conseil du tableau de bord. La lecture ne déclenche jamais de génération ; « Régénérer » appelle
 * la route POST. Une semaine sans conseil (404) est un état normal qui propose de le générer, pas une erreur.
 * Fourni au niveau de la page pour charger en parallèle du reste du tableau de bord.
 */
@Injectable()
export class DashboardAdviceState {
  private readonly api = inject(DashboardAdviceApiService);
  private readonly aiEnabled = inject(AI_FEATURES);
  private readonly adviceValue = signal<DashboardAdvice | null>(null);
  private readonly loadingValue = signal(false);
  private readonly generatingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);

  readonly advice = this.adviceValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly generating = this.generatingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  /** Message d'erreur affichable dans la carte, ou null. */
  readonly errorMessage = computed(() => this.errorValue()?.userMessage ?? null);

  constructor() {
    void this.load();
  }

  /** Relance la lecture du conseil stocké (bouton « Réessayer » après une erreur de lecture). */
  reload(): void {
    void this.load();
  }

  /** Génère le conseil de la semaine courante, ou remplace le précédent. */
  async regenerate(): Promise<void> {
    if (!this.aiEnabled) {
      return;
    }
    this.generatingValue.set(true);
    this.errorValue.set(null);
    try {
      this.adviceValue.set(await firstValueFrom(this.api.regenerate()));
    } catch (error) {
      this.errorValue.set(asAppError(error));
    } finally {
      this.generatingValue.set(false);
    }
  }

  private async load(): Promise<void> {
    if (!this.aiEnabled) {
      return;
    }
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      this.adviceValue.set(await firstValueFrom(this.api.get()));
    } catch (error) {
      const appError = asAppError(error);
      if (appError.status === NOT_FOUND) {
        this.adviceValue.set(null);
      } else {
        this.errorValue.set(appError);
      }
    } finally {
      this.loadingValue.set(false);
    }
  }
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}
