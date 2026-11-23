import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { MealSlot } from '../models/meal-slot';
import type { PlannedMeal } from '../models/planned-meal.model';
import { MealPlanApi } from './meal-plan.api';

const keyOf = (date: string, meal: MealSlot): string => `${date}|${meal}`;

/**
 * Repas planifiés de la semaine affichée. Chaque changement de semaine recharge la liste ; une réponse tardive
 * d'une autre semaine est ignorée. Une écriture réussie recharge la semaine. Fourni au niveau de la page.
 */
@Injectable()
export class MealPlanState {
  private readonly api = inject(MealPlanApi);
  private readonly mealsValue = signal<readonly PlannedMeal[]>([]);
  private readonly weekValue = signal<string | null>(null);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);

  readonly meals = this.mealsValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();

  /** Repas par case (date et repas), pour la grille. */
  private readonly byCell = computed(() => {
    const cells = new Map<string, PlannedMeal[]>();
    for (const meal of this.mealsValue()) {
      const key = keyOf(meal.date, meal.mealTag);
      cells.set(key, [...(cells.get(key) ?? []), meal]);
    }
    return cells;
  });

  mealsAt(date: string, meal: MealSlot): readonly PlannedMeal[] {
    return this.byCell().get(keyOf(date, meal)) ?? [];
  }

  async load(week: string): Promise<void> {
    this.weekValue.set(week);
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      const meals = await firstValueFrom(this.api.list(week));
      if (this.weekValue() === week) {
        this.mealsValue.set(meals);
      }
    } catch (error) {
      if (this.weekValue() === week) {
        this.mealsValue.set([]);
        this.errorValue.set(asAppError(error));
      }
    } finally {
      if (this.weekValue() === week) {
        this.loadingValue.set(false);
      }
    }
  }

  /** @throws {AppError} quand l'API refuse le placement */
  async place(recipeId: string, date: string, mealTag: MealSlot): Promise<void> {
    await this.write(() => firstValueFrom(this.api.create({ recipeId, date, mealTag })));
  }

  /** @throws {AppError} quand l'API refuse le retrait */
  async remove(id: string): Promise<void> {
    await this.write(() => firstValueFrom(this.api.delete(id)));
  }

  private async write(operation: () => Promise<unknown>): Promise<void> {
    try {
      await operation();
    } catch (error) {
      throw asAppError(error);
    }
    const week = this.weekValue();
    if (week !== null) {
      await this.load(week);
    }
  }
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}
