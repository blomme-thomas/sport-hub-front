import { render, screen, within } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
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

describe('MealGridComponent', () => {
  it('affiche les sept jours et les trois lignes de repas, sans heures', async () => {
    await render(MealGridComponent, { inputs: { dates: WEEK } });

    const grid = screen.getByRole('table', { name: 'Repas de la semaine' });
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(8);
    expect(
      within(grid)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent?.trim()),
    ).toEqual(['Matin', 'Midi', 'Soir']);
    expect(within(grid).getAllByRole('cell')).toHaveLength(21);
    expect(within(grid).queryByText(/\d{1,2}:\d{2}/)).not.toBeInTheDocument();
  });

  it('nomme chaque case par son repas et sa date', async () => {
    await render(MealGridComponent, { inputs: { dates: WEEK } });

    expect(
      screen.getByText('Midi, lundi 16 mars : aucun repas', { selector: '.visually-hidden' }),
    ).toBeInTheDocument();
  });
});
