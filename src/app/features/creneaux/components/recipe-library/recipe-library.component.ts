import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TEXTS } from '@shared/texts/texts';
import type { LibraryRecipe } from '../../models/library-recipe.model';
import { RECIPE_DRAG_TYPE } from '../meal-grid/meal-grid.component';

/**
 * Bibliothèque des recettes à placer. Sur ordinateur, chaque recette se glisse dans une case du calendrier ;
 * sur mobile, elle n'est que consultable (le placement est désactivé).
 */
@Component({
  selector: 'sh-recipe-library',
  templateUrl: './recipe-library.component.html',
  styleUrl: './recipe-library.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeLibraryComponent {
  readonly recipes = input.required<readonly LibraryRecipe[]>();
  /** Vrai sur ordinateur : les recettes peuvent être glissées dans le calendrier. */
  readonly canDrag = input(false);

  protected readonly t = TEXTS;

  protected onDragStart(event: DragEvent, recipe: LibraryRecipe): void {
    if (!this.canDrag()) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData(RECIPE_DRAG_TYPE, recipe.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
}
