import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TEXTS, fill } from '@shared/texts/texts';
import type { MealSlot } from '../../models/meal-slot';
import type { PlannedMeal } from '../../models/planned-meal.model';
import type { MealRecipeDetail } from '../../models/library-recipe.model';
import { RecipeSummaryComponent } from '../recipe-summary/recipe-summary.component';

function formatLongDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

/**
 * Fiche d'une recette placée : quand et à quel repas, puis la synthèse de la recette.
 * `detail` vaut `undefined` pendant le chargement, `null` si le back ne l'a pas renvoyée.
 * Le retrait d'un repas se fait depuis sa carte dans le calendrier.
 */
@Component({
  selector: 'sh-meal-detail',
  imports: [RecipeSummaryComponent],
  templateUrl: './meal-detail.component.html',
  styleUrl: './meal-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealDetailComponent {
  readonly plannedMeal = input.required<PlannedMeal>();
  readonly detail = input<MealRecipeDetail | null | undefined>(undefined);

  protected readonly t = TEXTS;
  protected readonly fill = fill;

  protected readonly when = computed(() =>
    fill(this.t.creneaux.placed.when, {
      date: formatLongDay(this.plannedMeal().date),
      meal: this.mealLabel(this.plannedMeal().mealTag),
    }),
  );

  private mealLabel(meal: MealSlot): string {
    return this.t.creneaux.meals[meal];
  }
}
