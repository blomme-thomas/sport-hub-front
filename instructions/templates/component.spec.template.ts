// Squelette — à copier à côté du composant : <name>.component.spec.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/09-testing.instructions.md
//
// Testing Library : on teste ce que voit l'utilisateur (rôles, textes), pas l'implémentation.

import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
// import { ExampleCardComponent } from './example-card.component';

declare const ExampleCardComponent: never;

describe('ExampleCardComponent', () => {
  it('affiche la distance formatée', async () => {
    await render(ExampleCardComponent, {
      inputs: { item: { id: '1', label: 'Sortie vélo', distanceKm: 42.04 } },
    });

    expect(screen.getByRole('heading', { name: 'Sortie vélo' })).toBeTruthy();
    expect(screen.getByText('42.0 km')).toBeTruthy();
  });

  it('émet l\'id quand on clique sur Ouvrir', async () => {
    const selected = vi.fn();
    await render(ExampleCardComponent, {
      inputs: { item: { id: '1', label: 'Sortie vélo', distanceKm: 10 } },
      on: { selected },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir' }));

    expect(selected).toHaveBeenCalledWith('1');
  });
});
