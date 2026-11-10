import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SessionActivityApi } from '../models/session-activity.api-model';
import type { LinkedActivity } from '../models/session.model';
import { SessionActivityComponent } from './session-activity.component';

const CANDIDATE: SessionActivityApi = {
  id: 'activity-2',
  type: 'running',
  startedAt: '2026-11-12T07:00:00.000Z',
  durationSeconds: 2700,
  distanceMeters: 8000,
  averageHeartRate: 150,
};

const LINKED: LinkedActivity = {
  id: 'activity-1',
  origin: 'automatique',
  linkedAt: '2026-11-12T18:00:00.000Z',
};

describe('SessionActivityComponent', () => {
  it('propose les activités associables et émet l’identifiant choisi', async () => {
    const link = vi.fn();
    await render(SessionActivityComponent, {
      inputs: { candidates: [CANDIDATE] },
      on: { link },
    });

    const list = screen.getByRole('list', { name: 'Activités associables' });
    expect(within(list).getByText('45 min · 8 km')).toBeInTheDocument();
    await userEvent.click(within(list).getByRole('button', { name: 'Associer' }));

    expect(link).toHaveBeenCalledWith('activity-2');
  });

  it('affiche l’activité liée avec son origine, et émet la dissociation', async () => {
    const unlink = vi.fn();
    await render(SessionActivityComponent, {
      inputs: {
        linked: LINKED,
        linkedDetail: { ...CANDIDATE, id: 'activity-1' },
        candidates: [],
      },
      on: { unlink },
    });

    expect(screen.getByText(/Rapprochée automatiquement/)).toBeInTheDocument();
    expect(screen.getByText('150 bpm')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dissocier' }));

    expect(unlink).toHaveBeenCalledTimes(1);
  });

  it('indique l’absence d’activité du même jour et de la même discipline', async () => {
    await render(SessionActivityComponent, { inputs: { candidates: [] } });

    expect(
      screen.getByText('Aucune activité du même jour et de la même discipline.'),
    ).toBeInTheDocument();
  });

  it('affiche l’erreur du back sous la section', async () => {
    await render(SessionActivityComponent, {
      inputs: {
        candidates: [],
        error: { userMessage: 'Activité introuvable.' } as never,
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Activité introuvable.');
  });
});
