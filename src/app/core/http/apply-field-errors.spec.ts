import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { AppError, FieldError } from './app-error';
import { applyFieldErrors, toControlPath } from './apply-field-errors';

function appErrorWith(fieldErrors: FieldError[]): AppError {
  return new AppError({
    code: 'VALIDATION_FAILED',
    status: 400,
    userMessage: 'Invalide',
    fieldErrors,
  });
}

function buildForm() {
  return new FormGroup({
    name: new FormControl(''),
    address: new FormGroup({ street: new FormControl('') }),
    items: new FormArray([new FormGroup({ label: new FormControl('') })]),
  });
}

describe('applyFieldErrors', () => {
  it('rattache le message au champ de premier niveau et le marque comme touché', () => {
    const form = buildForm();

    const orphans = applyFieldErrors(
      form,
      appErrorWith([{ field: 'name', message: 'Le nom est requis.' }]),
    );

    expect(form.controls.name.errors).toEqual({ server: 'Le nom est requis.' });
    expect(form.controls.name.touched).toBe(true);
    expect(orphans).toEqual([]);
  });

  it('rattache le message à un champ imbriqué', () => {
    const form = buildForm();

    applyFieldErrors(form, appErrorWith([{ field: 'address.street', message: 'Rue invalide.' }]));

    expect(form.controls.address.controls.street.errors).toEqual({ server: 'Rue invalide.' });
  });

  it('rattache le message à un champ dans un tableau', () => {
    const form = buildForm();

    applyFieldErrors(
      form,
      appErrorWith([{ field: 'items[0].label', message: 'Libellé invalide.' }]),
    );

    expect(form.controls.items.at(0).get('label')?.errors).toEqual({ server: 'Libellé invalide.' });
  });

  it('joint les messages de plusieurs erreurs sur un même champ', () => {
    const form = buildForm();

    applyFieldErrors(
      form,
      appErrorWith([
        { field: 'name', message: 'Trop court.' },
        { field: 'name', message: 'Caractères interdits.' },
      ]),
    );

    expect(form.controls.name.errors).toEqual({ server: 'Trop court. Caractères interdits.' });
  });

  it('renvoie les erreurs sans champ correspondant sans les rattacher', () => {
    const form = buildForm();

    const orphans = applyFieldErrors(
      form,
      appErrorWith([
        { field: 'inconnu', message: 'Champ inconnu.' },
        { field: 'name', message: 'Le nom est requis.' },
      ]),
    );

    expect(orphans).toEqual(['Champ inconnu.']);
    expect(form.controls.name.errors).toEqual({ server: 'Le nom est requis.' });
  });

  it('retire l erreur serveur dès que le champ est modifié', () => {
    const form = buildForm();
    applyFieldErrors(form, appErrorWith([{ field: 'name', message: 'Le nom est requis.' }]));

    form.controls.name.setValue('Sortie');

    expect(form.controls.name.errors).toBeNull();
  });
});

describe('toControlPath', () => {
  it('convertit les index de tableau en segments de chemin', () => {
    expect(toControlPath('items[0].name')).toBe('items.0.name');
    expect(toControlPath('matrix[1][2]')).toBe('matrix.1.2');
  });

  it('laisse inchangé un chemin sans index', () => {
    expect(toControlPath('address.city')).toBe('address.city');
  });
});
