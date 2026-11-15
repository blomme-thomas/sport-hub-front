import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { CompletionCardComponent } from './completion-card.component';

describe('CompletionCardComponent', () => {
  it('affiche le pourcentage de réalisation et le détail chiffré', async () => {
    await render(CompletionCardComponent, {
      inputs: { view: { realised: 3, expected: 4, percent: 75 } },
    });

    expect(screen.getByText('75 %')).toBeInTheDocument();
    expect(screen.getByText('3 sur 4 séances réalisées')).toBeInTheDocument();
  });

  it('affiche un état vide explicite sans séance due', async () => {
    await render(CompletionCardComponent, {
      inputs: { view: { realised: 0, expected: 0, percent: null } },
    });

    expect(screen.getByText('Aucune séance passée sur cette période')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('affiche le chargement tant que la vue n’est pas reçue', async () => {
    await render(CompletionCardComponent, { inputs: { view: undefined, loading: true } });

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });
});
