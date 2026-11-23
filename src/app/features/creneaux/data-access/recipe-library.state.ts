import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { LibraryRecipe, RecipeTotals } from '../models/library-recipe.model';
import { RecipeLibraryApi } from './recipe-library.api';

/** Bibliothèque de recettes à placer dans le calendrier. Chargée quand le mode alimentation est affiché. */
@Injectable()
export class RecipeLibraryState {
  private readonly api = inject(RecipeLibraryApi);
  private readonly recipesValue = signal<readonly LibraryRecipe[]>([]);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);

  readonly recipes = this.recipesValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();

  /** Recharge la bibliothèque. Appelé par l'écran quand le mode alimentation est affiché. */
  reload(): void {
    void this.load();
  }

  /** Totaux d'une recette, calculés par le back. @throws {AppError} si la recette est refusée */
  async totalsOf(id: string): Promise<RecipeTotals> {
    try {
      return await firstValueFrom(this.api.totals(id));
    } catch (error) {
      throw error instanceof AppError ? error : toAppError(error);
    }
  }

  private async load(): Promise<void> {
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      this.recipesValue.set(await firstValueFrom(this.api.list()));
    } catch (error) {
      this.recipesValue.set([]);
      this.errorValue.set(error instanceof AppError ? error : toAppError(error));
    } finally {
      this.loadingValue.set(false);
    }
  }
}
