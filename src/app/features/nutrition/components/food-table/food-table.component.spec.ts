import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { foodsFixtures } from '../../../../../mocks/fixtures/foods.fixtures';
import { toFood } from '../../data-access/food.mapper';
import type { Food } from '../../models/food.model';
import { FoodTableComponent } from './food-table.component';

const foods: Food[] = foodsFixtures.map(toFood);

async function setup(list: Food[] = foods) {
  const edit = vi.fn();
  await render(FoodTableComponent, { inputs: { foods: list }, on: { edit } });
  return { edit };
}

describe('FoodTableComponent', () => {
  it('affiche les valeurs pour 100 g avec leur unité, et « — » pour une valeur vide', async () => {
    await setup();

    const row = screen.getByRole('row', { name: /Poulet/ });
    expect(row).toHaveTextContent('165');
    expect(row).toHaveTextContent('31 g');

    const spices = screen.getByRole('row', { name: /Épices/ });
    expect(spices.querySelectorAll('td')[0]).toHaveTextContent('Autres');
    expect(spices).toHaveTextContent('—');
  });

  it('affiche toutes les catégories d’un aliment', async () => {
    await setup();

    const lentils = screen.getByRole('row', { name: /Lentilles/ });
    expect(lentils).toHaveTextContent('Protéines');
    expect(lentils).toHaveTextContent('Féculents');
  });

  it('émet l’aliment choisi depuis son bouton « Modifier » nommé', async () => {
    const user = userEvent.setup();
    const { edit } = await setup();

    await user.click(screen.getByRole('button', { name: 'Modifier Saumon' }));

    expect(edit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Saumon' }));
  });
});
