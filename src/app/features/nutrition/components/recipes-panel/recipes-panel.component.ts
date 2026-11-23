import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { TEXTS } from '@shared/texts/texts';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { RecipesState } from '../../data-access/recipes.state';
import { MEAL_TAGS, type MealTag } from '../../models/meal-tag';
import type { Recipe, RecipeDetail } from '../../models/recipe.model';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';
import { RecipeViewComponent } from '../recipe-view/recipe-view.component';

/** Onglet « Mes recettes » : recherche, filtre par repas avec compteurs, cartes, et consultation dans une modale. */
@Component({
  selector: 'sh-recipes-panel',
  imports: [
    NzButtonComponent,
    NzInputDirective,
    ModalComponent,
    RecipeCardComponent,
    RecipeViewComponent,
  ],
  templateUrl: './recipes-panel.component.html',
  styleUrl: './recipes-panel.component.scss',
  providers: [RecipesState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipesPanelComponent {
  protected readonly t = TEXTS;
  protected readonly state = inject(RecipesState);
  protected readonly mealTags = MEAL_TAGS;

  /** Recette consultée dans la modale, `null` quand elle est fermée. */
  protected readonly viewing = signal<RecipeDetail | null>(null);

  protected mealLabel(mealTag: MealTag): string {
    return this.t.nutrition.recipes.mealTags[mealTag];
  }

  protected onSearch(event: Event): void {
    this.state.setSearch((event.target as HTMLInputElement).value);
  }

  protected open(recipe: Recipe): void {
    const detail = this.state.detailOf(recipe.id);
    if (detail !== undefined) {
      this.viewing.set(detail);
    }
  }

  protected close(): void {
    this.viewing.set(null);
  }
}
