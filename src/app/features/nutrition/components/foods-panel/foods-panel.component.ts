import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TEXTS } from '@shared/texts/texts';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { AppError } from '../../../../core/http/app-error';
import { toAppError } from '../../../../core/http/problem-details.mapper';
import { FoodsState } from '../../data-access/foods.state';
import { FOOD_CATEGORIES, type FoodCategory } from '../../models/food-category';
import type { Food, FoodInput } from '../../models/food.model';
import { FoodFormComponent } from '../food-form/food-form.component';
import { FoodTableComponent } from '../food-table/food-table.component';

/** Onglet « Mes aliments » : recherche, filtre par catégorie avec compteurs, tableau et création ou modification dans une modale. */
@Component({
  selector: 'sh-foods-panel',
  imports: [
    NzButtonComponent,
    NzInputDirective,
    ModalComponent,
    FoodFormComponent,
    FoodTableComponent,
  ],
  templateUrl: './foods-panel.component.html',
  styleUrl: './foods-panel.component.scss',
  providers: [FoodsState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodsPanelComponent {
  protected readonly t = TEXTS;
  protected readonly state = inject(FoodsState);
  protected readonly categories = FOOD_CATEGORIES;

  private readonly messages = inject(NzMessageService);

  /** Aliment en cours de modification, `'new'` pour une création, `null` quand la modale est fermée. */
  protected readonly editing = signal<Food | 'new' | null>(null);
  protected readonly formFood = computed(() => {
    const target = this.editing();
    return target === null || target === 'new' ? null : target;
  });
  protected readonly formTitle = computed(() =>
    this.editing() === 'new'
      ? TEXTS.nutrition.foods.form.newTitle
      : TEXTS.nutrition.foods.form.editTitle,
  );
  protected readonly formError = signal<AppError | null>(null);

  protected categoryLabel(category: FoodCategory): string {
    return this.t.nutrition.foods.categories[category];
  }

  protected onSearch(event: Event): void {
    this.state.setSearch((event.target as HTMLInputElement).value);
  }

  protected openForm(target: Food | 'new'): void {
    this.formError.set(null);
    this.editing.set(target);
  }

  protected closeForm(): void {
    this.editing.set(null);
    this.formError.set(null);
  }

  protected onSaved(input: FoodInput): void {
    void this.save(input);
  }

  private async save(input: FoodInput): Promise<void> {
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
        ? TEXTS.nutrition.foods.messages.created
        : TEXTS.nutrition.foods.messages.updated,
    );
  }
}
