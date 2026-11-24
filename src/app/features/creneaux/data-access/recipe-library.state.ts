import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { TEXTS } from '@shared/texts/texts';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type {
  LibraryRecipe,
  MealRecipeDetail,
  RecipeFoodLine,
} from '../models/library-recipe.model';
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

  /**
   * Totaux et composition d'une recette (noms et unités des aliments inclus).
   * @throws {AppError} si la recette ou la liste des aliments est refusée
   */
  async detailOf(id: string): Promise<MealRecipeDetail> {
    try {
      const { composition, foods } = await firstValueFrom(
        forkJoin({ composition: this.api.composition(id), foods: this.api.foods() }),
      );
      const foodsById = new Map(foods.map((food) => [food.id, food]));
      const lines: RecipeFoodLine[] = composition.items.map((item) => {
        const food = foodsById.get(item.foodId);
        return {
          name: food?.name ?? TEXTS.creneaux.placed.unknownFood,
          quantity: item.quantity,
          unit: food?.unit ?? '',
        };
      });
      return { totals: composition.totals, foods: lines };
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
