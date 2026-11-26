import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { TEXTS, fill } from '@shared/texts/texts';
import { MacroSplitComponent } from '@shared/ui/macro-split/macro-split.component';
import { formatNutrient } from '@shared/utils/nutrient-format';
import type { Food } from '../../models/food.model';
import type { MealTag } from '../../models/meal-tag';
import type { NutritionGroup, RecipeDetail } from '../../models/recipe.model';

const GROUP_ORDER: readonly NutritionGroup[] = ['proteine', 'legume', 'feculent', 'libre'];

interface CompositionLine {
  name: string;
  quantity: string;
}

interface CompositionGroup {
  key: NutritionGroup;
  label: string;
  lines: CompositionLine[];
}

/** Consultation d'une recette : synthèse du back, composition par composant. Lecture seule. */
@Component({
  selector: 'sh-recipe-view',
  imports: [NzButtonComponent, MacroSplitComponent],
  templateUrl: './recipe-view.component.html',
  styleUrl: './recipe-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeViewComponent {
  readonly recipe = input.required<RecipeDetail>();
  /** Aliments de la base, pour afficher leur nom ; un aliment inconnu est signalé. */
  readonly foods = input.required<ReadonlyMap<string, Food>>();
  /** Demande de modification : l'écran ouvre le formulaire à la place de la consultation. */
  readonly edit = output<RecipeDetail>();
  /** Demande de suppression : l'écran demande confirmation avant de supprimer. */
  readonly delete = output<RecipeDetail>();

  protected readonly t = TEXTS;
  protected readonly fill = fill;

  protected readonly groups = computed<CompositionGroup[]>(() => {
    const recipe = this.recipe();
    return GROUP_ORDER.map((key) => ({
      key,
      label: this.t.nutrition.recipes.view.groups[key],
      lines: recipe.items
        .filter((item) => (item.component ?? 'libre') === key)
        .map((item) => {
          const food = this.foods().get(item.foodId);
          return {
            name: food?.name ?? this.t.nutrition.recipes.view.unknownFood,
            quantity: formatNutrient(
              item.quantity,
              this.t.nutrition.recipes.view.noQuantity,
              food?.unit ?? '',
            ),
          };
        }),
    })).filter((group) => group.lines.length > 0);
  });

  protected mealLabel(mealTag: MealTag): string {
    return this.t.nutrition.recipes.mealTags[mealTag];
  }
}
