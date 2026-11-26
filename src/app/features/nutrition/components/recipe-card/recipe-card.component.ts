import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TEXTS, fill } from '@shared/texts/texts';
import { MacroSplitComponent } from '@shared/ui/macro-split/macro-split.component';
import type { MealTag } from '../../models/meal-tag';
import type { Recipe, RecipeDetail } from '../../models/recipe.model';

/**
 * Carte d'une recette : nom, repas, et répartition des calories (anneau avec les kcal au centre, puis macros)
 * fournie par le back. Toute la carte ouvre la recette ; le nom porte le bouton accessible.
 */
@Component({
  selector: 'sh-recipe-card',
  imports: [MacroSplitComponent],
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

  protected mealLabel(mealTag: MealTag): string {
    return this.t.nutrition.recipes.mealTags[mealTag];
  }
}
