import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RecipeTotals } from '../../models/library-recipe.model';
import type { PlannedMeal } from '../../models/planned-meal.model';
import { MealDetailComponent } from './meal-detail.component';

const MEAL: PlannedMeal = {
  id: 'meal-1',
  recipeId: 'recipe-chicken',
  date: '2026-03-16',
  mealTag: 'midi',
};
const TOTALS: RecipeTotals = { calories: 437.5, proteins: 52.5, carbohydrates: 40.2, fats: 6.2 };

async function setup(totals: RecipeTotals | null | undefined, removing = false) {
  const removeRequested = vi.fn();
  await render(MealDetailComponent, {
    inputs: { plannedMeal: MEAL, totals, removing },
    on: { removeRequested },
  });
  return { removeRequested };
}

describe('MealDetailComponent', () => {
  it('indique le jour et le repas, puis les totaux du back', async () => {
    await setup(TOTALS);

    expect(screen.getByText('lundi 16 mars, Midi')).toBeInTheDocument();
    expect(screen.getByText('437,5')).toBeInTheDocument();
    expect(screen.getByText('52,5 g')).toBeInTheDocument();
    expect(screen.getByText('40,2 g')).toBeInTheDocument();
    expect(screen.getByText('6,2 g')).toBeInTheDocument();
  });

  it('affiche un chargement tant que les totaux ne sont pas reçus', async () => {
    await setup(undefined);

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it('signale des totaux indisponibles', async () => {
    await setup(null);

    expect(screen.getByText('Valeurs nutritionnelles indisponibles.')).toBeInTheDocument();
  });

  it('demande le retrait de ce repas seulement', async () => {
    const user = userEvent.setup();
    const { removeRequested } = await setup(TOTALS);

    await user.click(screen.getByRole('button', { name: 'Retirer du planning' }));

    expect(removeRequested).toHaveBeenCalledTimes(1);
  });

  it('désactive le retrait pendant l’envoi', async () => {
    await setup(TOTALS, true);

    expect(screen.getByRole('button', { name: 'Retirer du planning' })).toBeDisabled();
  });
});
