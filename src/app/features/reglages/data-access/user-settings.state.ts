import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { UserSettingsApiService } from './user-settings.api';

/**
 * État des réglages : cible hebdomadaire (secondes, ou null sans cible) et enregistrement.
 * Fourni au niveau de la page. La cible reste la même tant qu'elle n'est pas modifiée.
 */
@Injectable()
export class UserSettingsState {
  private readonly api = inject(UserSettingsApiService);
  private readonly targetValue = signal<number | null>(null);
  private readonly loadingValue = signal(true);
  private readonly savingValue = signal(false);
  private readonly savedValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);

  readonly weeklyTargetSeconds = this.targetValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly saving = this.savingValue.asReadonly();
  /** Vrai après un enregistrement réussi, jusqu'à la modification suivante. */
  readonly saved = this.savedValue.asReadonly();
  readonly error = this.errorValue.asReadonly();

  constructor() {
    void this.load();
  }

  reload(): void {
    void this.load();
  }

  /** Enregistre la cible (secondes), ou la retire avec null. */
  async save(seconds: number | null): Promise<void> {
    this.savingValue.set(true);
    this.savedValue.set(false);
    this.errorValue.set(null);
    try {
      const settings = await firstValueFrom(this.api.save(seconds));
      this.targetValue.set(settings.weeklyTargetSeconds);
      this.savedValue.set(true);
    } catch (error) {
      this.errorValue.set(asAppError(error));
    } finally {
      this.savingValue.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      const settings = await firstValueFrom(this.api.get());
      this.targetValue.set(settings.weeklyTargetSeconds);
    } catch (error) {
      this.errorValue.set(asAppError(error));
    } finally {
      this.loadingValue.set(false);
    }
  }
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}
