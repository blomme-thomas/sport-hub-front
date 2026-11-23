import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TEXTS, fill } from '@shared/texts/texts';
import { MEAL_SLOTS, type MealSlot } from '../../models/meal-slot';
import type { PlannedMeal } from '../../models/planned-meal.model';

/** Recette déposée dans une case : la grille ne fait que la signaler, l'écran l'enregistre. */
export interface PlacementRequest {
  recipeId: string;
  date: string;
  mealTag: MealSlot;
}

/** Type MIME utilisé pour transporter l'identifiant de la recette pendant le glisser-déposer. */
export const RECIPE_DRAG_TYPE = 'text/plain';

function formatShortDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function formatLongDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

const cellKey = (date: string, meal: MealSlot): string => `${date}|${meal}`;

/**
 * Grille de la semaine en mode alimentation : mêmes jours que le calendrier des séances, trois lignes fixes
 * (matin, midi, soir), sans heures ni séances. Une recette glissée dans une case est signalée à l'écran
 * (`placed`) ; un clic sur une recette placée ouvre sa fiche (`mealSelected`). Le dépôt est désactivé quand
 * `canDrop` est faux (mobile).
 */
@Component({
  selector: 'sh-meal-grid',
  templateUrl: './meal-grid.component.html',
  styleUrl: './meal-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealGridComponent {
  /** Dates `YYYY-MM-DD` de la semaine affichée, du lundi au dimanche. */
  readonly dates = input.required<readonly string[]>();
  /** Repas planifiés de la semaine affichée. */
  readonly plannedMeals = input<readonly PlannedMeal[]>([]);
  /** Nom de chaque recette, par identifiant. */
  readonly recipeNames = input<ReadonlyMap<string, string>>(new Map());
  /** Vrai sur ordinateur : une recette peut être déposée dans une case. */
  readonly canDrop = input(false);

  readonly placed = output<PlacementRequest>();
  readonly mealSelected = output<PlannedMeal>();

  protected readonly t = TEXTS;
  protected readonly fill = fill;
  protected readonly meals = MEAL_SLOTS;
  /** Case survolée pendant un glisser-déposer, pour la mettre en évidence. */
  protected readonly hoveredCell = signal<string | null>(null);

  private readonly cells = computed(() => {
    const byCell = new Map<string, PlannedMeal[]>();
    for (const meal of this.plannedMeals()) {
      const key = cellKey(meal.date, meal.mealTag);
      byCell.set(key, [...(byCell.get(key) ?? []), meal]);
    }
    return byCell;
  });

  protected dayLabel(date: string): string {
    return formatShortDay(date);
  }

  protected mealLabel(meal: MealSlot): string {
    return this.t.creneaux.meals[meal];
  }

  protected cellLabel(meal: MealSlot, date: string): string {
    return fill(this.t.creneaux.meals.cell, {
      meal: this.mealLabel(meal),
      date: formatLongDay(date),
    });
  }

  protected mealsIn(date: string, meal: MealSlot): readonly PlannedMeal[] {
    return this.cells().get(cellKey(date, meal)) ?? [];
  }

  protected nameOf(recipeId: string): string {
    return this.recipeNames().get(recipeId) ?? this.t.creneaux.placed.unknownRecipe;
  }

  protected isHovered(date: string, meal: MealSlot): boolean {
    return this.hoveredCell() === cellKey(date, meal);
  }

  protected onDragOver(event: DragEvent, date: string, meal: MealSlot): void {
    if (!this.canDrop()) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.hoveredCell.set(cellKey(date, meal));
  }

  protected onDragLeave(date: string, meal: MealSlot): void {
    if (this.isHovered(date, meal)) {
      this.hoveredCell.set(null);
    }
  }

  protected onDrop(event: DragEvent, date: string, meal: MealSlot): void {
    this.hoveredCell.set(null);
    if (!this.canDrop()) {
      return;
    }
    event.preventDefault();
    const recipeId = event.dataTransfer?.getData(RECIPE_DRAG_TYPE) ?? '';
    if (recipeId !== '') {
      this.placed.emit({ recipeId, date, mealTag: meal });
    }
  }
}
