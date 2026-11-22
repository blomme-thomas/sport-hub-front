import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GranularityToggleComponent } from './granularity-toggle.component';

describe('GranularityToggleComponent', () => {
  it('regroupe les options dans un groupe radio nommé Granularité', async () => {
    await render(GranularityToggleComponent, { inputs: { value: 'week' } });

    expect(screen.getByRole('radiogroup', { name: 'Granularité' })).toBeInTheDocument();
  });

  it('propose les options Semaine et Mois', async () => {
    await render(GranularityToggleComponent, { inputs: { value: 'week' } });

    expect(screen.getByRole('radio', { name: 'Semaine' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mois' })).toBeInTheDocument();
  });

  it('coche l option correspondant à la valeur courante', async () => {
    await render(GranularityToggleComponent, { inputs: { value: 'month' } });

    expect(screen.getByRole('radio', { name: 'Mois' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Semaine' })).not.toBeChecked();
  });

  it('émet month au clic sur Mois', async () => {
    const changed = vi.fn();
    await render(GranularityToggleComponent, { inputs: { value: 'week' }, on: { changed } });

    await userEvent.click(screen.getByRole('radio', { name: 'Mois' }));

    expect(changed).toHaveBeenCalledWith('month');
  });

  it('émet week au clic sur Semaine quand la valeur courante est Mois', async () => {
    const changed = vi.fn();
    await render(GranularityToggleComponent, { inputs: { value: 'month' }, on: { changed } });

    await userEvent.click(screen.getByRole('radio', { name: 'Semaine' }));

    expect(changed).toHaveBeenCalledWith('week');
  });
});
