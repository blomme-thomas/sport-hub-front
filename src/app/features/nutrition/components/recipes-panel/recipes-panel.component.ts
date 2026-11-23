import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TEXTS } from '@shared/texts/texts';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { AppError } from '../../../../core/http/app-error';
import { toAppError } from '../../../../core/http/problem-details.mapper';
import { RecipesState } from '../../data-access/recipes.state';
import { MEAL_TAGS, type MealTag } from '../../models/meal-tag';
import type { Recipe, RecipeDetail, RecipeInput } from '../../models/recipe.model';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';
import { RecipeFormComponent } from '../recipe-form/recipe-form.component';
import { RecipeViewComponent } from '../recipe-view/recipe-view.component';

/** Onglet « Mes recettes » : recherche, filtre par repas, cartes, consultation, et création ou modification dans une modale. */
@Component({
  selector: 'sh-recipes-panel',
  imports: [
    NzButtonComponent,
    NzInputDirective,
    ModalComponent,
    RecipeCardComponent,
    RecipeFormComponent,
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

  private readonly messages = inject(NzMessageService);

  /** Recette consultée dans la modale, `null` quand elle est fermée. */
  protected readonly viewing = signal<RecipeDetail | null>(null);

  /** Recette en cours de modification, `'new'` pour une création, `null` quand le formulaire est fermé. */
  protected readonly editing = signal<Recipe | 'new' | null>(null);
  protected readonly formRecipe = computed(() => {
    const target = this.editing();
    return target === null || target === 'new' ? null : target;
  });
  protected readonly formDetail = computed(() => {
    const recipe = this.formRecipe();
    return recipe === null ? undefined : this.state.detailOf(recipe.id);
  });
  protected readonly formTitle = computed(() =>
    this.editing() === 'new'
      ? TEXTS.nutrition.recipes.form.newTitle
      : TEXTS.nutrition.recipes.form.editTitle,
  );
  protected readonly formError = signal<AppError | null>(null);

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

  /** Depuis la consultation : on passe au formulaire de la même recette. */
  protected editFromView(detail: RecipeDetail): void {
    this.viewing.set(null);
    this.openForm(detail);
  }

  protected openForm(target: Recipe | 'new'): void {
    this.formError.set(null);
    this.editing.set(target);
  }

  protected closeForm(): void {
    this.editing.set(null);
    this.formError.set(null);
  }

  protected onSaved(input: RecipeInput): void {
    void this.save(input);
  }

  private async save(input: RecipeInput): Promise<void> {
    const target = this.editing();
    if (target === null) {
      return;
    }

    this.formError.set(null);
    try {
      if (target === 'new') {
        await this.state.create(input);
      } else {
        await this.state.update(target.id, input);
      }
    } catch (error) {
      this.formError.set(error instanceof AppError ? error : toAppError(error));
      return;
    }

    this.closeForm();
    this.messages.success(
      target === 'new'
        ? TEXTS.nutrition.recipes.form.messages.created
        : TEXTS.nutrition.recipes.form.messages.updated,
    );
  }
}
