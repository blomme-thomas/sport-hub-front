import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../../core/http/app-error';
import type { UpcomingSessionView } from '../../data-access/upcoming-sessions.state';
import { UpcomingSessionsCardComponent } from './upcoming-sessions-card.component';

const sortie: UpcomingSessionView = {
  id: 'session-1',
  dateLabel: 'lun. 30 nov.',
  timeLabel: '18:00',
  typeLabel: 'Course à pied',
  title: 'Fond en aisance',
  durationLabel: '45 min',
  ariaLabel: 'Séance Course à pied le lun. 30 nov. à 18:00. Ouvrir la séance',
};

const natation: UpcomingSessionView = {
  id: 'session-2',
  dateLabel: 'mar. 1 déc.',
  timeLabel: '07:15',
  typeLabel: 'Natation',
  title: null,
  durationLabel: '1h 00 min',
  ariaLabel: 'Séance Natation le mar. 1 déc. à 07:15. Ouvrir la séance',
};

function renderCard(inputs: Record<string, unknown>, on: Record<string, unknown> = {}) {
  return render(UpcomingSessionsCardComponent, {
    inputs: { sessions: undefined, ...inputs },
    on: { retry: vi.fn(), opened: vi.fn(), ...on },
  });
}

describe('UpcomingSessionsCardComponent', () => {
  it('affiche le chargement tant que la liste n’est pas reçue', async () => {
    await renderCard({ sessions: undefined });

    expect(screen.getByText('Chargement…')).toBeTruthy();
  });

  it('affiche un état vide explicite quand aucune séance n’est à venir', async () => {
    await renderCard({ sessions: [] });

    expect(screen.getByText('Aucune séance programmée à venir')).toBeTruthy();
  });

  it('liste les séances avec leur date, leur heure, leur type et leur titre', async () => {
    await renderCard({ sessions: [sortie, natation] });

    expect(screen.getByText('Séances programmées')).toBeTruthy();
    expect(screen.getByText('lun. 30 nov.')).toBeTruthy();
    expect(screen.getByText('18:00')).toBeTruthy();
    expect(screen.getByText('Course à pied')).toBeTruthy();
    expect(screen.getByText('Fond en aisance')).toBeTruthy();
    expect(screen.getByText('Natation')).toBeTruthy();
    expect(screen.getByText('1h 00 min')).toBeTruthy();
  });

  it('émet l’identifiant de la séance cliquée', async () => {
    const opened = vi.fn();
    await renderCard({ sessions: [sortie, natation] }, { opened });

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Séance Natation le mar. 1 déc. à 07:15. Ouvrir la séance',
      }),
    );

    expect(opened).toHaveBeenCalledWith('session-2');
  });

  it('affiche l’erreur avec un bouton Réessayer qui émet retry', async () => {
    const retry = vi.fn();
    await renderCard(
      {
        sessions: undefined,
        error: new AppError({ code: 'NETWORK', status: 0, userMessage: 'Connexion impossible.' }),
      },
      { retry },
    );

    expect(screen.getByRole('alert').textContent).toContain('Connexion impossible.');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(retry).toHaveBeenCalledOnce();
  });
});
