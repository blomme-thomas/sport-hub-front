import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { TEXTS, fill } from '@shared/texts/texts';
import { formatNutrient } from '@shared/utils/nutrient-format';
import type { MealSlot } from '../../models/meal-slot';
import type { PlannedMeal } from '../../models/planned-meal.model';
import type { RecipeTotals } from '../../models/library-recipe.model';

function formatLongDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

/**
 * Fiche d'une recette placée : quand et à quel repas, sa synthèse du back, et le retrait de ce seul repas.
 * `totals` vaut `undefined` pendant le chargement, `null` si le back ne les a pas renvoyés.
 */
@Component({
  selector: 'sh-meal-detail',
  imports: [NzButtonComponent],
  templateUrl: './meal-detail.component.html',
  styleUrl: './meal-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealDetailComponent {
  readonly plannedMeal = input.required<PlannedMeal>();
  readonly totals = input<RecipeTotals | null | undefined>(undefined);
  readonly removing = input(false);

  readonly removeRequested = output<void>();

  protected readonly t = TEXTS;
  protected readonly fill = fill;

  protected readonly when = computed(() =>
    fill(this.t.creneaux.placed.when, {
      date: formatLongDay(this.plannedMeal().date),
      meal: this.mealLabel(this.plannedMeal().mealTag),
    }),
  );

  protected readonly values = computed(() => {
    const totals = this.totals();
    if (totals === undefined || totals === null) {
      return null;
    }
    const empty = this.t.creneaux.placed.noValue;
    return {
      kcal: formatNutrient(totals.calories, empty),
      proteins: formatNutrient(totals.proteins, empty, 'g'),
      carbohydrates: formatNutrient(totals.carbohydrates, empty, 'g'),
      fats: formatNutrient(totals.fats, empty, 'g'),
    };
  });

  private mealLabel(meal: MealSlot): string {
    return this.t.creneaux.meals[meal];
  }
}
