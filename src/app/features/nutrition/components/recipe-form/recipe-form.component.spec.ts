import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { apiTestProviders } from '../../../../../mocks/api.testing';
import { foodsFixtures } from '../../../../../mocks/fixtures/foods.fixtures';
import { recipeDetailFixtures } from '../../../../../mocks/fixtures/recipes.fixtures';
import { toFood } from '../../data-access/food.mapper';
import { toRecipe, toRecipeDetail } from '../../data-access/recipe.mapper';
import type { Food } from '../../models/food.model';
import { RecipeFormComponent } from './recipe-form.component';

const foods: Food[] = foodsFixtures.map(toFood);
const CHICKEN = foods.find((food) => food.name === 'Poulet (blanc)')!;
const RICE = foods.find((food) => food.name === 'Riz cuit')!;
const BROCCOLI = foods.find((food) => food.name === 'Brocoli')!;

interface Inputs {
  recipe?: ReturnType<typeof toRecipe> | null;
  detail?: ReturnType<typeof toRecipeDetail> | undefined;
}

async function setup(inputs: Inputs = {}) {
  const saved = vi.fn();
  const cancelled = vi.fn();
  const user = userEvent.setup();
  await render(RecipeFormComponent, {
    inputs: { foods, recipe: null, detail: undefined, ...inputs },
    on: { saved, cancelled },
    providers: apiTestProviders(),
  });
  return { saved, cancelled, user };
}

/** Ligne ajoutée dans un groupe, identifiée par son bouton « Ajouter un aliment ». */
async function addRow(
  user: ReturnType<typeof userEvent.setup>,
  groupName: string,
): Promise<HTMLElement> {
  const group = screen.getByRole('group', { name: groupName });
  await user.click(within(group).getByRole('button', { name: 'Ajouter un aliment' }));
  const rows = within(group).getAllByRole('combobox');
  return rows[rows.length - 1]!;
}

describe('RecipeFormComponent', () => {
  it('bloque l’enregistrement sans nom ni repas', async () => {
    const { saved, user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByText('Choisissez au moins un repas.')).toBeInTheDocument();
    expect(screen.getByText('Ce champ est obligatoire.')).toBeInTheDocument();
  });

  it('propose en composant uniquement les aliments de sa famille', async () => {
    const { user } = await setup();

    const select = await addRow(user, 'Protéine');

    const options = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent?.trim());
    expect(options).toContain('Poulet (blanc)');
    expect(options).toContain('Lentilles cuites');
    expect(options).not.toContain('Riz cuit');
  });

  it('accepte tous les aliments dans la section libre', async () => {
    const { user } = await setup();

    const select = await addRow(user, 'Autre (optionnel)');

    expect(within(select).getAllByRole('option')).toHaveLength(foods.length + 1);
  });

  it('signale une ligne sans aliment et bloque l’enregistrement', async () => {
    const { saved, user } = await setup();
    await user.type(screen.getByLabelText('Nom de la recette'), 'Salade');
    await user.click(screen.getByRole('checkbox', { name: 'Midi' }));
    await addRow(user, 'Légume');

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByText('Choisissez un aliment, ou retirez la ligne.')).toBeInTheDocument();
  });

  it('émet la recette avec ses composants, la quantité et les lignes libres sans composant', async () => {
    const { saved, user } = await setup();
    await user.type(screen.getByLabelText('Nom de la recette'), 'Poulet riz');
    await user.click(screen.getByRole('checkbox', { name: 'Midi' }));
    await user.click(screen.getByRole('checkbox', { name: 'Soir' }));

    const protein = await addRow(user, 'Protéine');
    await user.selectOptions(protein, CHICKEN.id);
    await user.type(
      within(screen.getByRole('group', { name: 'Protéine' })).getByRole('spinbutton'),
      '150',
    );

    const free = await addRow(user, 'Autre (optionnel)');
    await user.selectOptions(free, BROCCOLI.id);

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith({
      name: 'Poulet riz',
      mealTags: ['midi', 'soir'],
      items: [
        { foodId: CHICKEN.id, component: 'proteine', quantity: 150 },
        { foodId: BROCCOLI.id, component: null, quantity: null },
      ],
    });
  });

  it('refuse une quantité nulle ou négative', async () => {
    const { saved, user } = await setup();
    await user.type(screen.getByLabelText('Nom de la recette'), 'Riz');
    await user.click(screen.getByRole('checkbox', { name: 'Midi' }));
    const feculent = await addRow(user, 'Féculent');
    await user.selectOptions(feculent, RICE.id);
    const quantity = within(screen.getByRole('group', { name: 'Féculent' })).getByRole(
      'spinbutton',
    );

    await user.type(quantity, '0');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByText('La quantité doit être supérieure à 0.')).toBeInTheDocument();
  });

  it('pré-remplit une recette existante et affiche sa synthèse du back', async () => {
    const recipe = toRecipe(recipeDetailFixtures[0]!);
    const detail = toRecipeDetail(recipeDetailFixtures[0]!);
    await setup({ recipe, detail });

    expect(screen.getByLabelText('Nom de la recette')).toHaveValue('Poulet riz légumes');
    expect(screen.getByRole('checkbox', { name: 'Midi' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Matin' })).not.toBeChecked();
    expect(screen.getByRole('combobox', { name: 'Protéine : aliment' })).toHaveValue(CHICKEN.id);
    expect(
      within(screen.getByRole('group', { name: 'Féculent' })).getByRole('spinbutton'),
    ).toHaveValue(120);
    expect(screen.getByText('437,5')).toBeInTheDocument();
  });

  it('indique qu’une création n’a pas encore de synthèse', async () => {
    await setup();

    expect(
      screen.getByText('Enregistrez la recette pour afficher sa synthèse.'),
    ).toBeInTheDocument();
  });

  it('annule sans émettre de recette', async () => {
    const { saved, cancelled, user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(cancelled).toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();
  });
});
