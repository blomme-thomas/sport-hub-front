import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { goalsTestProviders } from '../../../../mocks/goals.testing';
import type { Goal } from '../models/goal.model';
import { GoalListComponent } from './goal-list.component';

const triathlon: Goal = {
  id: 'goal-triathlon',
  title: 'Triathlon de Paris',
  type: 'evenement',
  targetDate: '2026-12-06',
  eventFormat: 'olympique',
  targetTime: { hours: 2, minutes: 30, seconds: 0 },
};

const volume: Goal = {
  id: 'goal-volume',
  title: 'Volume hebdomadaire',
  type: 'volume',
  targetDate: null,
  eventFormat: null,
  targetTime: null,
};

async function renderList(goals: Goal[], emptyMessage = 'Aucun objectif.') {
  const edit = vi.fn();
  const deleted = vi.fn();
  await render(GoalListComponent, {
    inputs: { goals, heading: 'À venir', emptyMessage },
    on: { edit, delete: deleted },
    providers: goalsTestProviders(),
  });
  return { edit, deleted };
}

describe('GoalListComponent', () => {
  it('affiche les objectifs dans une section nommée par son intitulé', async () => {
    await renderList([triathlon, volume]);

    const section = screen.getByRole('region', { name: 'À venir' });

    expect(section.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('Triathlon de Paris')).toBeInTheDocument();
    expect(screen.getByText('Volume hebdomadaire')).toBeInTheDocument();
  });

  it('affiche le message vide sans élément de liste quand la section n a aucun objectif', async () => {
    await renderList([], 'Aucun objectif à venir.');

    expect(screen.getByText('Aucun objectif à venir.')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('nomme chaque bouton Modifier avec le titre de l objectif', async () => {
    await renderList([triathlon]);

    expect(screen.getByRole('button', { name: 'Modifier Triathlon de Paris' })).toBeInTheDocument();
  });

  it('nomme chaque bouton Supprimer avec le titre de l objectif', async () => {
    await renderList([triathlon, volume]);

    expect(
      screen.getByRole('button', { name: 'Supprimer Triathlon de Paris' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Supprimer Volume hebdomadaire' }),
    ).toBeInTheDocument();
  });

  it('émet edit avec l objectif quand l utilisateur clique sur Modifier', async () => {
    const { edit, deleted } = await renderList([triathlon]);

    await userEvent.click(screen.getByRole('button', { name: 'Modifier Triathlon de Paris' }));

    expect(edit).toHaveBeenCalledWith(triathlon);
    expect(deleted).not.toHaveBeenCalled();
  });

  it('émet delete avec l objectif quand l utilisateur clique sur Supprimer', async () => {
    const { edit, deleted } = await renderList([triathlon]);

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer Triathlon de Paris' }));

    expect(deleted).toHaveBeenCalledWith(triathlon);
    expect(edit).not.toHaveBeenCalled();
  });
});
