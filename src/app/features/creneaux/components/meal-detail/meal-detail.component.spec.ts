import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import type { MealRecipeDetail } from '../../models/library-recipe.model';
import type { PlannedMeal } from '../../models/planned-meal.model';
import { MealDetailComponent } from './meal-detail.component';

const MEAL: PlannedMeal = {
  id: 'meal-1',
  recipeId: 'recipe-chicken',
  date: '2026-03-16',
  mealTag: 'midi',
};
const DETAIL: MealRecipeDetail = {
  totals: { calories: 437.5, proteins: 52.5, carbohydrates: 40.2, fats: 6.2 },
  foods: [
    { name: 'Poulet', quantity: 150, unit: 'g' },
    { name: 'Riz cuit', quantity: null, unit: 'g' },
  ],
};

async function setup(detail: MealRecipeDetail | null | undefined) {
  await render(MealDetailComponent, { inputs: { plannedMeal: MEAL, detail } });
}

describe('MealDetailComponent', () => {
  it('indique le jour et le repas, puis les totaux du back', async () => {
    await setup(DETAIL);

    expect(screen.getByText('lundi 16 mars, Midi')).toBeInTheDocument();
    expect(screen.getByText('437,5')).toBeInTheDocument();
    expect(screen.getByText('52,5 g')).toBeInTheDocument();
    expect(screen.getByText('40,2 g')).toBeInTheDocument();
    expect(screen.getByText('6,2 g')).toBeInTheDocument();
  });

  it('liste les aliments de la recette avec leur quantité', async () => {
    await setup(DETAIL);

    expect(screen.getByRole('heading', { name: 'Aliments' })).toBeInTheDocument();
    expect(screen.getByText('Poulet')).toBeInTheDocument();
    expect(screen.getByText('150 g')).toBeInTheDocument();
    expect(screen.getByText('Riz cuit')).toBeInTheDocument();
    expect(screen.getByText('Quantité non renseignée')).toBeInTheDocument();
  });

  it('affiche un chargement tant que la fiche n’est pas reçue', async () => {
    await setup(undefined);

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it('signale des totaux indisponibles', async () => {
    await setup(null);

    expect(screen.getByText('Valeurs nutritionnelles indisponibles.')).toBeInTheDocument();
  });

  it('n’affiche plus de bouton de retrait : il est sur la carte du calendrier', async () => {
    await setup(DETAIL);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
