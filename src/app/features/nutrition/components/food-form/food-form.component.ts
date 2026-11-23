import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
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
import { NzInputNumberComponent } from 'ng-zorro-antd/input-number';
import { TEXTS } from '@shared/texts/texts';
import { AppError } from '../../../../core/http/app-error';
import { FOOD_CATEGORIES, type FoodCategory } from '../../models/food-category';
import type { Food, FoodInput } from '../../models/food.model';

type FormFieldName =
  'name' | 'unit' | 'categories' | 'calories' | 'proteins' | 'carbohydrates' | 'fats' | 'sugars';

const FORM_FIELDS: Readonly<Record<FormFieldName, true>> = {
  name: true,
  unit: true,
  categories: true,
  calories: true,
  proteins: true,
  carbohydrates: true,
  fats: true,
  sugars: true,
};

const NUTRITION_FIELDS = ['calories', 'proteins', 'carbohydrates', 'fats', 'sugars'] as const;
const NAME_MAX_LENGTH = 200;
const UNIT_MAX_LENGTH = 20;

const notBlank = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

const atLeastOneCategory = (control: AbstractControl): ValidationErrors | null =>
  Array.isArray(control.value) && control.value.length === 0 ? { required: true } : null;

/**
 * Formulaire de création ou de modification d'un aliment. Émet une `FoodInput` quand la saisie est valide côté
 * client. Les valeurs nutritionnelles sont facultatives ; une valeur vide reste `null`. Les erreurs du back
 * sont affichées près du champ concerné, celles qui ne visent aucun champ sont listées en alerte.
 */
@Component({
  selector: 'sh-food-form',
  imports: [ReactiveFormsModule, NzButtonComponent, NzInputDirective, NzInputNumberComponent],
  templateUrl: './food-form.component.html',
  styleUrl: './food-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodFormComponent implements OnInit {
  readonly food = input<Food | null>(null);
  readonly submitting = input(false);
  readonly serverError = input<AppError | null>(null);

  readonly saved = output<FoodInput>();
  readonly cancelled = output<void>();

  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly t = TEXTS;
  protected readonly categories = FOOD_CATEGORIES;
  protected readonly nutritionFields = NUTRITION_FIELDS;

  protected readonly form = this.fb.group({
    name: this.fb.control('', [
      Validators.required,
      notBlank,
      Validators.maxLength(NAME_MAX_LENGTH),
    ]),
    unit: this.fb.control('', [
      Validators.required,
      notBlank,
      Validators.maxLength(UNIT_MAX_LENGTH),
    ]),
    categories: this.fb.control<FoodCategory[]>([], [atLeastOneCategory]),
    calories: this.fb.control<number | null>(null, [Validators.min(0)]),
    proteins: this.fb.control<number | null>(null, [Validators.min(0)]),
    carbohydrates: this.fb.control<number | null>(null, [Validators.min(0)]),
    fats: this.fb.control<number | null>(null, [Validators.min(0)]),
    sugars: this.fb.control<number | null>(null, [Validators.min(0)]),
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
    const food = this.food();
    this.form.setValue({
      name: food?.name ?? '',
      unit: food?.unit ?? '',
      categories: food ? [...food.categories] : [],
      calories: food?.calories ?? null,
      proteins: food?.proteins ?? null,
      carbohydrates: food?.carbohydrates ?? null,
      fats: food?.fats ?? null,
      sugars: food?.sugars ?? null,
    });
  }

  protected hasCategory(category: FoodCategory): boolean {
    return this.form.controls.categories.value.includes(category);
  }

  protected toggleCategory(category: FoodCategory, checked: boolean): void {
    const current = this.form.controls.categories.value;
    const next = FOOD_CATEGORIES.filter((item) =>
      item === category ? checked : current.includes(item),
    );
    this.form.controls.categories.setValue([...next]);
    this.form.controls.categories.markAsTouched();
  }

  protected errorOf(field: FormFieldName): string | null {
    const serverMessage = this.serverMessages().get(field);
    if (serverMessage !== undefined) {
      return serverMessage;
    }
    const control = this.form.get(field);
    if (control?.hasError('required') && control.touched) {
      return field === 'categories'
        ? this.t.nutrition.foods.form.categoriesRequired
        : this.t.nutrition.foods.form.required;
    }
    return control?.hasError('min') && control.touched
      ? this.t.nutrition.foods.form.negative
      : null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.toFoodInput());
  }

  private toFoodInput(): FoodInput {
    const value = this.form.getRawValue();
    return {
      name: value.name,
      unit: value.unit,
      categories: [...value.categories],
      calories: value.calories,
      proteins: value.proteins,
      carbohydrates: value.carbohydrates,
      fats: value.fats,
      sugars: value.sugars,
    };
  }
}

function isFormField(field: string): field is FormFieldName {
  return Object.hasOwn(FORM_FIELDS, field);
}
