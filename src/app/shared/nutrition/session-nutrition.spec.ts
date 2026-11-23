import { FormBuilder } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  createSessionNutritionForm,
  patchSessionNutrition,
  readSessionNutrition,
} from './session-nutrition';

const builder = new FormBuilder();

describe('session-nutrition', () => {
  it('est valide et vide par défaut, et ne lit que des valeurs absentes', () => {
    const form = createSessionNutritionForm(builder);

    expect(form.valid).toBe(true);
    expect(readSessionNutrition(form)).toEqual({
      carbsGrams: null,
      carbsUnit: null,
      hydrationMilliliters: null,
    });
  });

  it('exige les glucides et leur unité ensemble, dans les deux sens', () => {
    const form = createSessionNutritionForm(builder);

    form.controls.carbsGrams.setValue(60);
    expect(form.hasError('carbsPair')).toBe(true);

    form.controls.carbsGrams.setValue(null);
    form.controls.carbsUnit.setValue('par_heure');
    expect(form.hasError('carbsPair')).toBe(true);

    form.controls.carbsGrams.setValue(60);
    expect(form.valid).toBe(true);
  });

  it('borne les glucides à un entier de 1 à 1000 grammes', () => {
    const form = createSessionNutritionForm(builder);
    form.controls.carbsUnit.setValue('pour_la_seance');

    for (const grams of [0, 1001]) {
      form.controls.carbsGrams.setValue(grams);
      expect(form.controls.carbsGrams.hasError('range')).toBe(true);
    }
    form.controls.carbsGrams.setValue(12.5);
    expect(form.controls.carbsGrams.hasError('integer')).toBe(true);
    form.controls.carbsGrams.setValue(1000);
    expect(form.valid).toBe(true);
  });

  it('borne l’hydratation à un entier de 1 à 20000 millilitres', () => {
    const form = createSessionNutritionForm(builder);

    form.controls.hydrationMilliliters.setValue(20001);
    expect(form.controls.hydrationMilliliters.hasError('range')).toBe(true);
    form.controls.hydrationMilliliters.setValue(500);
    expect(form.valid).toBe(true);
    expect(readSessionNutrition(form).hydrationMilliliters).toBe(500);
  });

  it('remplit le groupe depuis une séance enregistrée', () => {
    const form = createSessionNutritionForm(builder);

    patchSessionNutrition(form, {
      carbsGrams: 60,
      carbsUnit: 'par_heure',
      hydrationMilliliters: 750,
    });

    expect(readSessionNutrition(form)).toEqual({
      carbsGrams: 60,
      carbsUnit: 'par_heure',
      hydrationMilliliters: 750,
    });
  });
});
