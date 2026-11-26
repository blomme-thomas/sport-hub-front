import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TEXTS, fill } from '@shared/texts/texts';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { formatNutrient } from '@shared/utils/nutrient-format';
import type { FoodCategory } from '../../models/food-category';
import type { Food } from '../../models/food.model';

/** Tableau de la base d'aliments : valeurs pour 100 g, vides affichées « — », icônes modifier et supprimer par ligne. */
@Component({
  selector: 'sh-food-table',
  imports: [IconComponent],
  templateUrl: './food-table.component.html',
  styleUrl: './food-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodTableComponent {
  readonly foods = input.required<readonly Food[]>();
  readonly edit = output<Food>();
  readonly delete = output<Food>();

  protected readonly t = TEXTS;
  protected readonly fill = fill;

  protected categoryLabel(category: FoodCategory): string {
    return this.t.nutrition.foods.categories[category];
  }

  /** Valeur nutritionnelle affichée, unité en grammes pour les macros. */
  protected amount(value: number | null, unit = ''): string {
    return formatNutrient(value, this.t.nutrition.foods.table.noValue, unit);
  }
}
