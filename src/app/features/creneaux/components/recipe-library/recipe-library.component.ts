import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TEXTS, fill } from '@shared/texts/texts';
import { type MealSlot, MEAL_SLOTS } from '../../models/meal-slot';
import type { LibraryRecipe } from '../../models/library-recipe.model';
import { RECIPE_DRAG_TYPE } from '../meal-grid/meal-grid.component';

/** Normalise pour la recherche : minuscules, sans espaces superflus, insensible à la casse. */
function normalize(text: string): string {
  return text.trim().toLocaleLowerCase('fr-FR');
}

/**
 * Bibliothèque des recettes à placer, en cartes, avec une recherche par nom et un filtre par repas.
 * Sur ordinateur, chaque carte se glisse dans une case du calendrier ; sur mobile, elle n'est que consultable.
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
  /** Demande d'ouverture de la fiche d'une recette (clic sur son nom). */
  readonly recipeSelected = output<LibraryRecipe>();
  /** Glissement commencé sur une recette, puis terminé : la grille s'en sert pour refuser les cases hors repas. */
  readonly dragStarted = output<LibraryRecipe>();
  readonly dragEnded = output<void>();

  protected readonly t = TEXTS;
  protected readonly fill = fill;
  protected readonly mealSlots = MEAL_SLOTS;

  protected readonly search = signal('');
  /** Repas filtré, `null` pour toutes les recettes. */
  protected readonly mealFilter = signal<MealSlot | null>(null);

  /** Nombre de recettes par repas, pour les libellés des filtres. */
  protected readonly counts = computed(() => {
    const recipes = this.recipes();
    return Object.fromEntries(
      MEAL_SLOTS.map((slot) => [slot, recipes.filter((r) => r.mealTags.includes(slot)).length]),
    ) as Record<MealSlot, number>;
  });

  protected readonly visible = computed(() => {
    const query = normalize(this.search());
    const meal = this.mealFilter();
    return this.recipes().filter(
      (recipe) =>
        (query === '' || normalize(recipe.name).includes(query)) &&
        (meal === null || recipe.mealTags.includes(meal)),
    );
  });

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected selectMeal(meal: MealSlot | null): void {
    this.mealFilter.set(meal);
  }

  protected mealLabel(meal: MealSlot): string {
    return this.t.creneaux.meals[meal];
  }

  protected tagsOf(recipe: LibraryRecipe): string {
    return recipe.mealTags.map((meal) => this.mealLabel(meal)).join(' · ');
  }

  protected onDragStart(event: DragEvent, recipe: LibraryRecipe): void {
    if (!this.canDrag()) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData(RECIPE_DRAG_TYPE, recipe.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
    this.dragStarted.emit(recipe);
  }
}
