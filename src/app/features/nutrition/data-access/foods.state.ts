import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { FoodCategory } from '../models/food-category';
import type { Food, FoodInput } from '../models/food.model';
import { toFoodRequest } from './food.mapper';
import { countFoodsByCategory, filterFoods } from './food-filter';
import { FoodsApi } from './foods.api';

/**
 * État de l'onglet « Mes aliments » : base chargée une fois, recherche et catégorie appliquées localement
 * (les compteurs par catégorie restent justes quel que soit le filtre). Chaque écriture réussie recharge la base.
 * Fourni au niveau de l'onglet pour vivre le temps de l'écran.
 */
@Injectable()
export class FoodsState {
  private readonly api = inject(FoodsApi);
  private readonly foodsValue = signal<readonly Food[]>([]);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);
  private readonly savingValue = signal(false);
  private readonly searchValue = signal('');
  private readonly categoryValue = signal<FoodCategory | null>(null);

  readonly search = this.searchValue.asReadonly();
  readonly category = this.categoryValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly saving = this.savingValue.asReadonly();
  readonly total = computed(() => this.foodsValue().length);
  readonly counts = computed(() => countFoodsByCategory(this.foodsValue()));
  readonly visible = computed(() =>
    filterFoods(this.foodsValue(), { search: this.searchValue(), category: this.categoryValue() }),
  );
  /** Base vide, et non recherche sans résultat. */
  readonly isEmpty = computed(
    () => !this.loadingValue() && this.errorValue() === null && this.foodsValue().length === 0,
  );

  constructor() {
    this.reload();
  }

  reload(): void {
    void this.load();
  }

  setSearch(value: string): void {
    this.searchValue.set(value);
  }

  selectCategory(category: FoodCategory | null): void {
    this.categoryValue.set(category);
  }

  /** @throws {AppError} quand l'API refuse la création ; la base n'est pas rechargée */
  create(input: FoodInput): Promise<void> {
    return this.write(() => firstValueFrom(this.api.create(toFoodRequest(input))));
  }

  /** @throws {AppError} quand l'API refuse la modification ; la base n'est pas rechargée */
  update(id: string, input: FoodInput): Promise<void> {
    return this.write(() => firstValueFrom(this.api.update(id, toFoodRequest(input))));
  }

  private async load(): Promise<void> {
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      this.foodsValue.set(await firstValueFrom(this.api.list()));
    } catch (error) {
      this.foodsValue.set([]);
      this.errorValue.set(asAppError(error));
    } finally {
      this.loadingValue.set(false);
    }
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
    await this.load();
  }
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}
