import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PeriodSelectorComponent } from './period-selector.component';

describe('PeriodSelectorComponent', () => {
  it('marque la période active avec aria-pressed et émet la période choisie', async () => {
    const changed = vi.fn();
    await render(PeriodSelectorComponent, { inputs: { value: 'month' }, on: { changed } });

    expect(screen.getByRole('button', { name: 'Mois en cours' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Semaine en cours' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Semaine en cours' }));

    expect(changed).toHaveBeenCalledWith('week');
  });

  it('présente le bouton calendrier désactivé', async () => {
    await render(PeriodSelectorComponent, { inputs: { value: 'week' } });

    expect(
      screen.getByRole('button', { name: 'Choisir des dates (bientôt disponible)' }),
    ).toBeDisabled();
  });
});
