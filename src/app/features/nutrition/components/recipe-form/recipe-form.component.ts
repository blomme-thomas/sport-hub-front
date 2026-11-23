import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { TEXTS, fill } from '@shared/texts/texts';
import { formatNutrient } from '@shared/utils/nutrient-format';
import { AppError } from '../../../../core/http/app-error';
import type { FoodCategory } from '../../models/food-category';
import type { Food } from '../../models/food.model';
import { MEAL_TAGS, type MealTag } from '../../models/meal-tag';
import type {
  NutritionGroup,
  Recipe,
  RecipeComponent,
  RecipeDetail,
  RecipeInput,
} from '../../models/recipe.model';

/** Composants d'une recette, dans l'ordre d'affichage. Chacun n'accepte que des aliments de sa famille. */
const COMPONENTS: readonly RecipeComponent[] = ['proteine', 'legume', 'feculent'];
const GROUPS: readonly NutritionGroup[] = [...COMPONENTS, 'libre'];
const FAMILY: Record<RecipeComponent, FoodCategory> = {
  proteine: 'proteine',
  legume: 'legume',
  feculent: 'feculent',
};
const NAME_MAX_LENGTH = 200;

type FormFieldName = 'name' | 'mealTags';
const FORM_FIELDS: Readonly<Record<FormFieldName, true>> = { name: true, mealTags: true };

/** Ligne de composition : un aliment (pas encore choisi tant que `foodId` est `null`) et sa quantité facultative. */
export interface ItemRow {
  key: number;
  foodId: string | null;
  quantity: number | null;
}

const notBlank = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

const atLeastOneMealTag = (control: AbstractControl): ValidationErrors | null =>
  Array.isArray(control.value) && control.value.length === 0 ? { required: true } : null;

/**
 * Formulaire de création ou de modification d'une recette, dans une grande modale. Colonne gauche : nom, repas
 * et composition par composant. Colonne droite : synthèse nutritionnelle calculée par le back, affichée une fois
 * la recette enregistrée. Émet une `RecipeInput` quand la saisie est valide côté client.
 */
@Component({
  selector: 'sh-recipe-form',
  imports: [ReactiveFormsModule, NzButtonComponent, NzInputDirective],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeFormComponent implements OnInit {
  /** Recette modifiée ; `null` pour une création. */
  readonly recipe = input<Recipe | null>(null);
  /** Synthèse du back pour la recette modifiée ; `undefined` pour une création. */
  readonly detail = input<RecipeDetail | undefined>(undefined);
  readonly foods = input.required<readonly Food[]>();
  readonly submitting = input(false);
  readonly serverError = input<AppError | null>(null);

  readonly saved = output<RecipeInput>();
  readonly cancelled = output<void>();

  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly t = TEXTS;
  protected readonly fill = fill;
  protected readonly components = COMPONENTS;
  protected readonly groups = GROUPS;
  protected readonly mealTags = MEAL_TAGS;

  protected readonly form = this.fb.group({
    name: this.fb.control('', [
      Validators.required,
      notBlank,
      Validators.maxLength(NAME_MAX_LENGTH),
    ]),
    mealTags: this.fb.control<MealTag[]>([], [atLeastOneMealTag]),
  });

  /** Lignes par groupe : un composant ou « libre ». Gérées ici, pas par le formulaire réactif. */
  protected readonly rows = signal<Record<NutritionGroup, ItemRow[]>>({
    proteine: [],
    legume: [],
    feculent: [],
    libre: [],
  });
  /** Une tentative d'enregistrement a eu lieu : les lignes sans aliment sont signalées. */
  protected readonly submitted = signal(false);
  private nextKey = 0;

  protected readonly foodById = computed(
    () => new Map(this.foods().map((food) => [food.id, food])),
  );

  /** Aliments proposés par groupe : une famille pour un composant, tous pour « libre ». */
  protected readonly optionsByGroup = computed<Record<NutritionGroup, readonly Food[]>>(() => {
    const foods = this.foods();
    return {
      proteine: foods.filter((food) => food.categories.includes(FAMILY.proteine)),
      legume: foods.filter((food) => food.categories.includes(FAMILY.legume)),
      feculent: foods.filter((food) => food.categories.includes(FAMILY.feculent)),
      libre: foods,
    };
  });

  protected readonly summary = computed(() => {
    const totals = this.detail()?.totals;
    if (totals === undefined) {
      return null;
    }
    const empty = this.t.nutrition.recipes.noValue;
    return {
      kcal: formatNutrient(totals.calories, empty),
      proteins: formatNutrient(totals.proteins, empty, 'g'),
      carbohydrates: formatNutrient(totals.carbohydrates, empty, 'g'),
      fats: formatNutrient(totals.fats, empty, 'g'),
      ignored: this.detail()?.ignored.length ?? 0,
    };
  });

  private readonly serverMessages = computed(() => {
    const messages = new Map<FormFieldName, string>();
    for (const fieldError of this.serverError()?.fieldErrors ?? []) {
      if (isFormField(fieldError.field)) {
        const previous = messages.get(fieldError.field);
        messages.set(
          fieldError.field,
          previous === undefined ? fieldError.message : `${previous} ${fieldError.message}`,
        );
      }
    }
    return messages;
  });

  protected readonly alertMessages = computed<readonly string[]>(() => {
    const error = this.serverError();
    if (error === null) {
      return [];
    }
    const orphans = error.fieldErrors
      .filter((fieldError) => !isFormField(fieldError.field))
      .map((fieldError) => fieldError.message);
    if (orphans.length > 0) {
      return orphans;
    }
    return error.fieldErrors.length === 0 ? [error.userMessage] : [];
  });

  ngOnInit(): void {
    const recipe = this.recipe();
    this.form.setValue({
      name: recipe?.name ?? '',
      mealTags: recipe ? [...recipe.mealTags] : [],
    });
    if (recipe !== null) {
      const rows = emptyRows();
      for (const item of recipe.items) {
        rows[item.component ?? 'libre'].push({
          key: this.nextKey++,
          foodId: item.foodId,
          quantity: item.quantity,
        });
      }
      this.rows.set(rows);
    }
  }

  protected groupLabel(group: NutritionGroup): string {
    return this.t.nutrition.recipes.form.components[group];
  }

  protected hasMealTag(mealTag: MealTag): boolean {
    return this.form.controls.mealTags.value.includes(mealTag);
  }

  protected toggleMealTag(mealTag: MealTag, checked: boolean): void {
    const current = this.form.controls.mealTags.value;
    const next = MEAL_TAGS.filter((item) => (item === mealTag ? checked : current.includes(item)));
    this.form.controls.mealTags.setValue([...next]);
    this.form.controls.mealTags.markAsTouched();
  }

  protected addRow(group: NutritionGroup): void {
    const row: ItemRow = { key: this.nextKey++, foodId: null, quantity: null };
    this.rows.update((current) => ({ ...current, [group]: [...current[group], row] }));
  }

  protected removeRow(group: NutritionGroup, key: number): void {
    this.rows.update((current) => ({
      ...current,
      [group]: current[group].filter((row) => row.key !== key),
    }));
  }

  protected setFood(group: NutritionGroup, key: number, value: string): void {
    this.updateRow(group, key, { foodId: value === '' ? null : value });
  }

  protected setQuantity(group: NutritionGroup, key: number, value: string): void {
    const quantity = value.trim() === '' ? null : Number(value);
    this.updateRow(group, key, {
      quantity: quantity === null || Number.isNaN(quantity) ? null : quantity,
    });
  }

  protected unitOf(foodId: string | null): string {
    return foodId === null ? '' : (this.foodById().get(foodId)?.unit ?? '');
  }

  protected foodErrorOf(row: ItemRow): string | null {
    return this.submitted() && row.foodId === null
      ? this.t.nutrition.recipes.form.foodRequired
      : null;
  }

  protected quantityErrorOf(row: ItemRow): string | null {
    return row.quantity !== null && row.quantity <= 0
      ? this.t.nutrition.recipes.form.quantityPositive
      : null;
  }

  protected errorOf(field: FormFieldName): string | null {
    const serverMessage = this.serverMessages().get(field);
    if (serverMessage !== undefined) {
      return serverMessage;
    }
    const control = this.form.get(field);
    if (!control?.hasError('required') || !(control.touched || this.submitted())) {
      return null;
    }
    return field === 'mealTags'
      ? this.t.nutrition.recipes.form.mealTagsRequired
      : this.t.nutrition.recipes.form.required;
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.hasInvalidRow()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.toRecipeInput());
  }

  private updateRow(group: NutritionGroup, key: number, patch: Partial<ItemRow>): void {
    this.rows.update((current) => ({
      ...current,
      [group]: current[group].map((row) => (row.key === key ? { ...row, ...patch } : row)),
    }));
  }

  private hasInvalidRow(): boolean {
    return GROUPS.some((group) =>
      this.rows()[group].some(
        (row) => row.foodId === null || (row.quantity !== null && row.quantity <= 0),
      ),
    );
  }

  private toRecipeInput(): RecipeInput {
    const value = this.form.getRawValue();
    const items = GROUPS.flatMap((group) =>
      this.rows()[group].flatMap((row) =>
        row.foodId === null
          ? []
          : [
              {
                foodId: row.foodId,
                component: group === 'libre' ? null : group,
                quantity: row.quantity,
              },
            ],
      ),
    );
    return { name: value.name, mealTags: [...value.mealTags], items };
  }
}

function emptyRows(): Record<NutritionGroup, ItemRow[]> {
  return { proteine: [], legume: [], feculent: [], libre: [] };
}

function isFormField(field: string): field is FormFieldName {
  return Object.hasOwn(FORM_FIELDS, field);
}
