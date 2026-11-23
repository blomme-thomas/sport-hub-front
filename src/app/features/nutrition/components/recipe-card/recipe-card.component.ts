import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TEXTS, fill } from '@shared/texts/texts';
import { formatNutrient } from '@shared/utils/nutrient-format';
import type { MealTag } from '../../models/meal-tag';
import type { Recipe, RecipeDetail } from '../../models/recipe.model';

/** Carte d'une recette : nom, repas et synthèse kcal, protéines, glucides, lipides fournie par le back. */
@Component({
  selector: 'sh-recipe-card',
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCardComponent {
  readonly recipe = input.required<Recipe>();
  /** Synthèse du back ; `undefined` tant qu'elle n'est pas chargée. */
  readonly detail = input<RecipeDetail | undefined>(undefined);
  readonly open = output<Recipe>();

  protected readonly t = TEXTS;
  protected readonly fill = fill;

  protected readonly summary = computed(() => {
    const totals = this.detail()?.totals;
    if (totals === undefined) {
      return null;
    }
    return {
      kcal: formatNutrient(totals.calories, this.t.nutrition.recipes.noValue),
      proteins: formatNutrient(totals.proteins, this.t.nutrition.recipes.noValue, 'g'),
      carbohydrates: formatNutrient(totals.carbohydrates, this.t.nutrition.recipes.noValue, 'g'),
      fats: formatNutrient(totals.fats, this.t.nutrition.recipes.noValue, 'g'),
    };
  });

  protected mealLabel(mealTag: MealTag): string {
    return this.t.nutrition.recipes.mealTags[mealTag];
  }
}
