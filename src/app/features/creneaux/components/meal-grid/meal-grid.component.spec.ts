import { render, screen, within, fireEvent } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import type { PlannedMeal } from '../../models/planned-meal.model';
import { MealGridComponent } from './meal-grid.component';

const WEEK = [
  '2026-03-16',
  '2026-03-17',
  '2026-03-18',
  '2026-03-19',
  '2026-03-20',
  '2026-03-21',
  '2026-03-22',
];
const RECIPE_ID = '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d01';
const PLACED: PlannedMeal = {
  id: 'meal-1',
  recipeId: RECIPE_ID,
  date: '2026-03-17',
  mealTag: 'midi',
};
const RECIPE_NAMES = new Map([[RECIPE_ID, 'Poulet riz légumes']]);

async function setup(inputs: Partial<{ plannedMeals: PlannedMeal[]; canDrop: boolean }> = {}) {
  const placed = vi.fn();
  const mealSelected = vi.fn();
  await render(MealGridComponent, {
    inputs: { dates: WEEK, recipeNames: RECIPE_NAMES, ...inputs },
    on: { placed, mealSelected },
  });
  return { placed, mealSelected };
}

function cell(rowName: string, dayIndex: number): HTMLElement {
  const grid = screen.getByRole('table', { name: 'Repas de la semaine' });
  const row = within(grid).getByRole('rowheader', { name: rowName }).closest('tr')!;
  return within(row).getAllByRole('cell')[dayIndex]!;
}

describe('MealGridComponent', () => {
  it('affiche les sept jours et les trois lignes de repas, sans heures', async () => {
    await setup();

    const grid = screen.getByRole('table', { name: 'Repas de la semaine' });
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(8);
    expect(
      within(grid)
        .getAllByRole('rowheader')
        .map((header) => header.textContent?.trim()),
    ).toEqual(['Matin', 'Midi', 'Soir']);
    expect(within(grid).getAllByRole('cell')).toHaveLength(21);
    expect(within(grid).queryByText(/\d{1,2}:\d{2}/)).not.toBeInTheDocument();
  });

  it('nomme chaque case par son repas et sa date', async () => {
    await setup();

    expect(
      screen.getByText('Midi, lundi 16 mars : aucun repas', { selector: '.visually-hidden' }),
    ).toBeInTheDocument();
  });

  it('affiche le nom de la recette placée dans sa case et l’ouvre au clic', async () => {
    const { mealSelected } = await setup({ plannedMeals: [PLACED] });

    const placedButton = within(cell('Midi', 1)).getByRole('button', {
      name: 'Ouvrir Poulet riz légumes',
    });
    fireEvent.click(placedButton);

    expect(mealSelected).toHaveBeenCalledWith(PLACED);
  });

  it('accepte plusieurs recettes dans la même case', async () => {
    await setup({ plannedMeals: [PLACED, { ...PLACED, id: 'meal-2' }] });

    expect(within(cell('Midi', 1)).getAllByRole('button')).toHaveLength(2);
  });

  it('signale la recette déposée dans une case, avec sa date et son repas', async () => {
    const { placed } = await setup({ canDrop: true });
    const target = cell('Soir', 2);

    fireEvent.drop(target, { dataTransfer: { getData: () => RECIPE_ID } });

    expect(placed).toHaveBeenCalledWith({
      recipeId: RECIPE_ID,
      date: '2026-03-18',
      mealTag: 'soir',
    });
  });

  it('accepte le survol pendant un glissement sur ordinateur, sans le refuser', async () => {
    await setup({ canDrop: true });

    expect(fireEvent.dragOver(cell('Soir', 2), { dataTransfer: { dropEffect: '' } })).toBe(false);
  });

  it('n’accepte aucun dépôt quand le placement est désactivé (mobile)', async () => {
    const { placed } = await setup({ canDrop: false });
    const target = cell('Soir', 2);

    expect(fireEvent.dragOver(target, { dataTransfer: { dropEffect: '' } })).toBe(true);
    fireEvent.drop(target, { dataTransfer: { getData: () => RECIPE_ID } });

    expect(placed).not.toHaveBeenCalled();
  });

  it('ignore un dépôt sans identifiant de recette', async () => {
    const { placed } = await setup({ canDrop: true });

    fireEvent.drop(cell('Matin', 0), { dataTransfer: { getData: () => '' } });

    expect(placed).not.toHaveBeenCalled();
  });
});
