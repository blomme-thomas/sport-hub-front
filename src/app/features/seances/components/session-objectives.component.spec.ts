import { render, screen, within } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import type { SessionAchievement, SessionObjectives } from '../models/session.model';
import { SessionObjectivesComponent } from './session-objectives.component';

const OBJECTIVES: SessionObjectives = {
  distanceMeters: 10000,
  zonePercentages: [10, 20, 40, 20, 10],
};

describe('SessionObjectivesComponent', () => {
  it('affiche la distance cible et la répartition cible par zone', async () => {
    await render(SessionObjectivesComponent, {
      inputs: { objectives: OBJECTIVES, achievement: null },
    });

    expect(screen.getByText('10 km')).toBeInTheDocument();
    const zones = screen.getByRole('list', { name: 'Répartition cible par zone de FC' });
    expect(within(zones).getByText(/Z3 · 40 %/)).toBeInTheDocument();
    expect(screen.queryByText('Taux distance')).not.toBeInTheDocument();
  });

  it('plafonne le taux de distance affiché à 100 %', async () => {
    const achievement: SessionAchievement = {
      distanceRate: 120,
      durationRate: 83.3,
      zoneGapsPoints: [0, -5, 10, 0, -5],
    };
    await render(SessionObjectivesComponent, { inputs: { objectives: OBJECTIVES, achievement } });

    expect(screen.getByText('Taux distance').nextElementSibling).toHaveTextContent('100 %');
    expect(screen.getByText('Taux durée').nextElementSibling).toHaveTextContent('83,3 %');
  });

  it('affiche les écarts signés par zone', async () => {
    const achievement: SessionAchievement = {
      distanceRate: 80,
      durationRate: 80,
      zoneGapsPoints: [0, -5, 10, 0, -5],
    };
    await render(SessionObjectivesComponent, { inputs: { objectives: OBJECTIVES, achievement } });

    const gaps = screen.getByRole('list', { name: 'Écart par zone, en points de pourcentage' });
    expect(within(gaps).getByText('+10 pts')).toBeInTheDocument();
    expect(within(gaps).getAllByText('−5 pts')).toHaveLength(2);
    expect(within(gaps).getAllByText('0 pt')).toHaveLength(2);
  });

  it('affiche un tiret quand la distance cible n’est pas renseignée', async () => {
    await render(SessionObjectivesComponent, {
      inputs: { objectives: { distanceMeters: null, zonePercentages: null }, achievement: null },
    });

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
