import {
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';

/** Unité de la cible de glucides d'une séance : par heure, ou pour la séance entière. */
export const SESSION_CARBS_UNITS = ['par_heure', 'pour_la_seance'] as const;

export type SessionCarbsUnit = (typeof SESSION_CARBS_UNITS)[number];

/** Bornes du back : glucides en grammes entiers, hydratation en millilitres entiers. */
export const CARBS_GRAMS_MIN = 1;
export const CARBS_GRAMS_MAX = 1000;
export const HYDRATION_MILLILITERS_MIN = 1;
export const HYDRATION_MILLILITERS_MAX = 20000;

/** Nutrition d'une séance, telle que le back la stocke : deux champs de glucides vont ensemble. */
export interface SessionNutrition {
  carbsGrams: number | null;
  carbsUnit: SessionCarbsUnit | null;
  hydrationMilliliters: number | null;
}

/** Groupe de formulaire de la nutrition d'une séance. */
export type SessionNutritionForm = FormGroup<{
  carbsGrams: FormControl<number | null>;
  carbsUnit: FormControl<SessionCarbsUnit | null>;
  hydrationMilliliters: FormControl<number | null>;
}>;

const isWhole = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  return value === null || Number.isInteger(value) ? null : { integer: true };
};

/** Glucides et unité se renseignent ensemble ou pas du tout. */
const carbsTogether = (group: AbstractControl): ValidationErrors | null => {
  const grams = group.get('carbsGrams')?.value ?? null;
  const unit = group.get('carbsUnit')?.value ?? null;
  return (grams === null) === (unit === null) ? null : { carbsPair: true };
};

/** Crée le groupe de la nutrition d'une séance, vide, avec ses bornes et sa règle de paire. */
export function createSessionNutritionForm(fb: FormBuilder): SessionNutritionForm {
  return fb.group(
    {
      carbsGrams: fb.control<number | null>(null, [
        isWhole,
        (control) =>
          control.value === null ||
          (control.value >= CARBS_GRAMS_MIN && control.value <= CARBS_GRAMS_MAX)
            ? null
            : { range: true },
      ]),
      carbsUnit: fb.control<SessionCarbsUnit | null>(null),
      hydrationMilliliters: fb.control<number | null>(null, [
        isWhole,
        (control) =>
          control.value === null ||
          (control.value >= HYDRATION_MILLILITERS_MIN && control.value <= HYDRATION_MILLILITERS_MAX)
            ? null
            : { range: true },
      ]),
    },
    { validators: [carbsTogether] },
  );
}

/** Valeurs saisies : une valeur vide reste `null`, c'est ce que le back attend pour « absent » ou « effacé ». */
export function readSessionNutrition(form: SessionNutritionForm): SessionNutrition {
  const value = form.getRawValue();
  return {
    carbsGrams: value.carbsGrams,
    carbsUnit: value.carbsUnit,
    hydrationMilliliters: value.hydrationMilliliters,
  };
}

/** Remplit le groupe depuis une séance enregistrée. */
export function patchSessionNutrition(
  form: SessionNutritionForm,
  nutrition: SessionNutrition,
): void {
  form.setValue({
    carbsGrams: nutrition.carbsGrams ?? null,
    carbsUnit: nutrition.carbsUnit ?? null,
    hydrationMilliliters: nutrition.hydrationMilliliters ?? null,
  });
}
