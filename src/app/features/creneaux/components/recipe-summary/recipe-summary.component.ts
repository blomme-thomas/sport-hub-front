import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TEXTS } from '@shared/texts/texts';
import { MacroSplitComponent } from '@shared/ui/macro-split/macro-split.component';
import { formatNutrient } from '@shared/utils/nutrient-format';
import type { MealRecipeDetail, RecipeFoodLine } from '../../models/library-recipe.model';

/**
 * Synthèse d'une recette : répartition des calories (calories au centre) et liste des aliments avec leur quantité.
 * `detail` vaut `undefined` pendant le chargement, `null` si le back ne l'a pas renvoyée.
 */
@Component({
  selector: 'sh-recipe-summary',
  imports: [MacroSplitComponent],
  templateUrl: './recipe-summary.component.html',
  styleUrl: './recipe-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeSummaryComponent {
  readonly detail = input<MealRecipeDetail | null | undefined>(undefined);

  protected readonly t = TEXTS;

  protected quantityOf(food: RecipeFoodLine): string {
    return formatNutrient(food.quantity, this.t.creneaux.placed.noQuantity, food.unit);
  }
}
