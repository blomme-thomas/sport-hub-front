import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PeriodSelectorComponent } from './period-selector.component';

describe('PeriodSelectorComponent', () => {
  it('marque la période active avec aria-pressed et émet la période choisie', async () => {
    const changed = vi.fn();
    await render(PeriodSelectorComponent, { inputs: { value: '30d' }, on: { changed } });

    expect(screen.getByRole('button', { name: '30 derniers jours' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '7 derniers jours' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await userEvent.click(screen.getByRole('button', { name: '3 derniers mois' }));

    expect(changed).toHaveBeenCalledWith('3m');
  });

  it('présente le bouton calendrier désactivé', async () => {
    await render(PeriodSelectorComponent, { inputs: { value: '7d' } });

    expect(
      screen.getByRole('button', { name: 'Choisir des dates (bientôt disponible)' }),
    ).toBeDisabled();
  });
});
