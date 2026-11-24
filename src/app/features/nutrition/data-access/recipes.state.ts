import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, firstValueFrom, forkJoin, of, switchMap } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { Food } from '../models/food.model';
import type { MealTag } from '../models/meal-tag';
import type {
  Recipe,
  RecipeDetail,
  RecipeInput,
  RecipeItem,
  RecipePreview,
} from '../models/recipe.model';
import { FoodsApi } from './foods.api';
import { toRecipeRequest } from './recipe.mapper';
import { countRecipesByMealTag, filterRecipes } from './recipe-filter';
import { RecipesApi } from './recipes.api';

/**
 * État de l'onglet « Mes recettes » : recettes et leur synthèse chargées ensemble, puis recherche et repas
 * appliqués localement. La synthèse de chaque recette vient du back (`GET /api/recipes/:id`) : la liste seule
 * n'en porte pas. Les noms d'aliments de la consultation viennent de la base d'aliments.
 */
/** Délai après la dernière modification avant de demander un aperçu au back. */
const PREVIEW_DEBOUNCE_MS = 250;

@Injectable()
export class RecipesState {
  private readonly api = inject(RecipesApi);
  private readonly foodsApi = inject(FoodsApi);
  private readonly recipesValue = signal<readonly Recipe[]>([]);
  private readonly detailsValue = signal<ReadonlyMap<string, RecipeDetail>>(new Map());
  private readonly foodsValue = signal<ReadonlyMap<string, Food>>(new Map());
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);
  private readonly savingValue = signal(false);
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
  /** Aliments triés par nom, pour les listes de choix du formulaire. */
  readonly foods = computed(() =>
    [...this.foodsValue().values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'fr-FR', { sensitivity: 'base' }),
    ),
  );
  readonly saving = this.savingValue.asReadonly();

  /** Dernier aperçu reçu du back pour la composition en cours de saisie ; `null` tant qu'il n'y en a pas. */
  private readonly previewValue = signal<RecipePreview | null>(null);
  readonly preview = this.previewValue.asReadonly();
  private readonly previewRequests = new Subject<readonly RecipeItem[] | null>();

  constructor() {
    this.reload();
    this.previewRequests
      .pipe(
        debounceTime(PREVIEW_DEBOUNCE_MS),
        switchMap((items) =>
          items === null
            ? of(null)
            : this.api
                .preview({
                  items: items.map((item) => ({
                    foodId: item.foodId,
                    component: item.component,
                    quantity: item.quantity,
                  })),
                })
                .pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((preview) => this.previewValue.set(preview));
  }

  /** Demande l'aperçu de la composition saisie ; les appels rapprochés ne déclenchent qu'un seul calcul. */
  previewComposition(items: readonly RecipeItem[]): void {
    this.previewRequests.next(items);
  }

  /** Efface l'aperçu, à la fermeture du formulaire. */
  clearPreview(): void {
    this.previewValue.set(null);
    this.previewRequests.next(null);
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

  /** @throws {AppError} quand l'API refuse la création ; la liste n'est pas rechargée */
  create(input: RecipeInput): Promise<void> {
    return this.write(() => firstValueFrom(this.api.create(toRecipeRequest(input))));
  }

  /** @throws {AppError} quand l'API refuse la modification ; la liste n'est pas rechargée */
  update(id: string, input: RecipeInput): Promise<void> {
    return this.write(() => firstValueFrom(this.api.update(id, toRecipeRequest(input))));
  }

  /**
   * @param confirm `true` retire aussi les repas planifiés de la recette ; sans lui, l'API refuse une recette planifiée.
   * @throws {AppError} quand l'API refuse la suppression (`RECIPE_IN_USE` si la recette est planifiée)
   */
  remove(id: string, confirm: boolean): Promise<void> {
    return this.write(() => firstValueFrom(this.api.delete(id, confirm)));
  }

  private async write(operation: () => Promise<unknown>): Promise<void> {
    this.savingValue.set(true);
    try {
      await operation();
    } catch (error) {
      throw asAppError(error);
    } finally {
      this.savingValue.set(false);
    }
    // La liste est rechargée pour que les totaux des cartes reflètent la recette enregistrée.
    await this.load();
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
