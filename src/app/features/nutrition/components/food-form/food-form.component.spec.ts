import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { apiTestProviders } from '../../../../../mocks/api.testing';
import { foodsFixtures } from '../../../../../mocks/fixtures/foods.fixtures';
import { AppError } from '../../../../core/http/app-error';
import { toFood } from '../../data-access/food.mapper';
import type { Food } from '../../models/food.model';
import { FoodFormComponent } from './food-form.component';

const poulet: Food = toFood(foodsFixtures[0]!);

interface FormInputs {
  food?: Food | null;
  serverError?: AppError | null;
}

async function setup(inputs: FormInputs = {}) {
  const saved = vi.fn();
  const cancelled = vi.fn();
  await render(FoodFormComponent, {
    inputs: { food: null, ...inputs },
    on: { saved, cancelled },
    providers: apiTestProviders(),
  });
  return { saved, cancelled };
}

describe('FoodFormComponent', () => {
  it('bloque l’enregistrement sans nom, sans unité ni catégorie', async () => {
    const user = userEvent.setup();
    const { saved } = await setup();

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByText('Choisissez au moins une catégorie.')).toBeInTheDocument();
    expect(screen.getAllByText('Ce champ est obligatoire.')).toHaveLength(2);
  });

  it('émet un aliment valide, les valeurs vides restant null', async () => {
    const user = userEvent.setup();
    const { saved } = await setup();

    await user.type(screen.getByLabelText('Nom'), 'Curry');
    await user.type(screen.getByLabelText('Unité'), 'g');
    await user.click(screen.getByRole('checkbox', { name: 'Autres' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith({
      name: 'Curry',
      unit: 'g',
      categories: ['autre'],
      calories: null,
      proteins: null,
      carbohydrates: null,
      fats: null,
      sugars: null,
    });
  });

  it('exige au moins une catégorie et garde l’ordre de la liste', async () => {
    const user = userEvent.setup();
    const { saved } = await setup({ food: poulet });
    const protein = screen.getByRole('checkbox', { name: 'Protéines' });
    const legume = screen.getByRole('checkbox', { name: 'Légumes' });

    await user.click(legume);
    await user.click(protein);
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(saved).toHaveBeenLastCalledWith(expect.objectContaining({ categories: ['legume'] }));

    await user.click(legume);
    expect(screen.getByText('Choisissez au moins une catégorie.')).toBeInTheDocument();
  });

  it('pré-remplit le formulaire en modification', async () => {
    await setup({ food: poulet });

    expect(screen.getByLabelText('Nom')).toHaveValue('Poulet (blanc)');
    expect(screen.getByLabelText('Unité')).toHaveValue('g');
    expect(screen.getByRole('checkbox', { name: 'Protéines' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Féculents' })).not.toBeChecked();
  });

  it('affiche les erreurs du back près du champ et les autres en alerte', async () => {
    await setup({
      serverError: new AppError({
        code: 'VALIDATION_FAILED',
        status: 400,
        detail: 'Requête invalide.',
        fieldErrors: [
          { field: 'name', message: 'Le nom est déjà utilisé.' },
          { field: 'categories', message: 'Catégorie inconnue.' },
          { field: 'items', message: 'Donnée inattendue.' },
        ],
        correlationId: 'c0',
        userMessage: 'Certaines informations saisies sont invalides.',
      }),
    });

    expect(screen.getByText('Le nom est déjà utilisé.')).toBeInTheDocument();
    expect(screen.getByText('Catégorie inconnue.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Donnée inattendue.');
  });

  it('annule sans émettre d’aliment', async () => {
    const user = userEvent.setup();
    const { saved, cancelled } = await setup();

    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(cancelled).toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();
  });
});
