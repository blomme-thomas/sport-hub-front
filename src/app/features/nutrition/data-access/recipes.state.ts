import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { Food } from '../models/food.model';
import type { MealTag } from '../models/meal-tag';
import type { Recipe, RecipeDetail } from '../models/recipe.model';
import { FoodsApi } from './foods.api';
import { countRecipesByMealTag, filterRecipes } from './recipe-filter';
import { RecipesApi } from './recipes.api';

/**
 * État de l'onglet « Mes recettes » : recettes et leur synthèse chargées ensemble, puis recherche et repas
 * appliqués localement. La synthèse de chaque recette vient du back (`GET /api/recipes/:id`) : la liste seule
 * n'en porte pas. Les noms d'aliments de la consultation viennent de la base d'aliments.
 */
@Injectable()
export class RecipesState {
  private readonly api = inject(RecipesApi);
  private readonly foodsApi = inject(FoodsApi);
  private readonly recipesValue = signal<readonly Recipe[]>([]);
  private readonly detailsValue = signal<ReadonlyMap<string, RecipeDetail>>(new Map());
  private readonly foodsValue = signal<ReadonlyMap<string, Food>>(new Map());
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);
  private readonly searchValue = signal('');
  private readonly mealTagValue = signal<MealTag | null>(null);

  readonly search = this.searchValue.asReadonly();
  readonly mealTag = this.mealTagValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly total = computed(() => this.recipesValue().length);
  readonly counts = computed(() => countRecipesByMealTag(this.recipesValue()));
  readonly visible = computed(() =>
    filterRecipes(this.recipesValue(), {
      search: this.searchValue(),
      mealTag: this.mealTagValue(),
    }),
  );
  /** Aucune recette enregistrée, et non recherche sans résultat. */
  readonly isEmpty = computed(
    () => !this.loadingValue() && this.errorValue() === null && this.recipesValue().length === 0,
  );
  readonly foodsById = this.foodsValue.asReadonly();

  constructor() {
    this.reload();
  }

  reload(): void {
    void this.load();
  }

  setSearch(value: string): void {
    this.searchValue.set(value);
  }

  selectMealTag(mealTag: MealTag | null): void {
    this.mealTagValue.set(mealTag);
  }

  /** Synthèse nutritionnelle d'une recette, `undefined` tant qu'elle n'est pas chargée. */
  detailOf(id: string): RecipeDetail | undefined {
    return this.detailsValue().get(id);
  }

  private async load(): Promise<void> {
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      const { recipes, foods } = await firstValueFrom(
        forkJoin({ recipes: this.api.list(), foods: this.foodsApi.list() }),
      );
      const details =
        recipes.length === 0
          ? []
          : await firstValueFrom(forkJoin(recipes.map((recipe) => this.api.get(recipe.id))));
      this.recipesValue.set(recipes);
      this.detailsValue.set(new Map(details.map((detail) => [detail.id, detail])));
      this.foodsValue.set(new Map(foods.map((food) => [food.id, food])));
    } catch (error) {
      this.recipesValue.set([]);
      this.detailsValue.set(new Map());
      this.errorValue.set(asAppError(error));
    } finally {
      this.loadingValue.set(false);
    }
  }
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}
