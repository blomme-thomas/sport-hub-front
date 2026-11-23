import { render, screen, fireEvent, within } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
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

async function setup(canDrop = true, selectedRange: { from: string; to: string } | null = null) {
  const rangeSelected = vi.fn();
  await render(MealGridComponent, {
    inputs: { dates: WEEK, canDrop, selectedRange },
    on: { rangeSelected },
  });
  const grid = screen.getByRole('table', { name: 'Repas de la semaine' });
  const header = (index: number) => within(grid).getAllByRole('columnheader')[index + 1]!;
  return { rangeSelected, header };
}

describe('MealGridComponent : période', () => {
  it('choisit une période en glissant d’un jour à l’autre sur les en-têtes', async () => {
    const { rangeSelected, header } = await setup();

    fireEvent.pointerDown(header(0), { button: 0 });
    fireEvent.pointerEnter(header(2));
    fireEvent.pointerUp(document);

    expect(rangeSelected).toHaveBeenCalledWith({ from: '2026-03-16', to: '2026-03-18' });
  });

  it('normalise la période quand on glisse vers la gauche', async () => {
    const { rangeSelected, header } = await setup();

    fireEvent.pointerDown(header(4), { button: 0 });
    fireEvent.pointerEnter(header(1));
    fireEvent.pointerUp(document);

    expect(rangeSelected).toHaveBeenCalledWith({ from: '2026-03-17', to: '2026-03-20' });
  });

  it('accepte un seul jour', async () => {
    const { rangeSelected, header } = await setup();

    fireEvent.pointerDown(header(3), { button: 0 });
    fireEvent.pointerUp(document);

    expect(rangeSelected).toHaveBeenCalledWith({ from: '2026-03-19', to: '2026-03-19' });
  });

  it('ne choisit rien sur mobile', async () => {
    const { rangeSelected, header } = await setup(false);

    fireEvent.pointerDown(header(0), { button: 0 });
    fireEvent.pointerEnter(header(2));
    fireEvent.pointerUp(document);

    expect(rangeSelected).not.toHaveBeenCalled();
  });

  it('met en évidence les colonnes de la période choisie', async () => {
    const { header } = await setup(true, { from: '2026-03-17', to: '2026-03-18' });

    expect(header(1)).toHaveClass('meal-grid__day--selected');
    expect(header(2)).toHaveClass('meal-grid__day--selected');
    expect(header(0)).not.toHaveClass('meal-grid__day--selected');
  });
});
