import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import {
  completedSessionApi,
  disciplinesFixtures,
  SESSION_DONE_ID,
  SESSION_ID,
} from '../../../../mocks/fixtures/sessions.fixtures';
import {
  SESSIONS_URL,
  sessionProblem,
  sessionsTestProviders,
  trackModulesReplace,
} from '../../../../mocks/sessions.testing';
import { server } from '../../../../mocks/server';
import { SessionPage } from './session.page';

function useFixtures(): void {
  server.use(
    http.get('*/api/disciplines', () => HttpResponse.json({ items: disciplinesFixtures })),
  );
}

async function renderPage(id: string) {
  await render(SessionPage, { inputs: { id }, providers: sessionsTestProviders() });
}

describe('SessionPage', () => {
  it('affiche la discipline, la date, le statut et les modules dans l’ordre', async () => {
    useFixtures();

    await renderPage(SESSION_ID);

    expect(
      await screen.findByRole('heading', { name: 'Course à pied', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Planifiée')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Modules (3) · 45 min' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Montre GPS')).toBeInTheDocument();
  });

  it('affiche la mention « Modifiée » quand la séance a été modifiée à la main', async () => {
    useFixtures();
    server.use(
      http.get(`${SESSIONS_URL}/:id`, () =>
        HttpResponse.json({
          ...(completedSessionApi as object),
          id: SESSION_ID,
          status: 'planifiee',
          modifiedManually: true,
          modules: [],
        }),
      ),
    );

    await renderPage(SESSION_ID);

    expect(await screen.findByText('Modifiée')).toBeInTheDocument();
  });

  it('affiche une séance réalisée en lecture seule, sans bouton d’enregistrement', async () => {
    useFixtures();

    await renderPage(SESSION_DONE_ID);

    expect(
      await screen.findByText('Séance réalisée : elle est affichée en lecture seule.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Enregistrer les modifications' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajouter un module' })).not.toBeInTheDocument();
  });

  it('enregistre la nouvelle durée et affiche la séance renvoyée', async () => {
    useFixtures();
    const user = userEvent.setup();
    const bodies = trackModulesReplace(() =>
      HttpResponse.json({
        id: SESSION_ID,
        date: '2026-11-12',
        disciplineTypeKey: 'course_a_pied',
        durationMinutes: 45,
        startTime: '18:00',
        status: 'planifiee',
        modifiedManually: true,
        description: null,
        equipment: 'Montre GPS',
        attentionPoints: 'Hydratation',
        modules: [
          {
            position: 1,
            type: 'echauffement',
            durationMinutes: 10,
            instruction: 'Footing souple',
            targetZones: null,
            perceivedEffort: null,
          },
          {
            position: 2,
            type: 'series',
            durationMinutes: 30,
            instruction: '4 x 400 m',
            targetZones: null,
            perceivedEffort: null,
          },
          {
            position: 3,
            type: 'retour_au_calme',
            durationMinutes: 10,
            instruction: 'Footing lent',
            targetZones: null,
            perceivedEffort: null,
          },
        ],
        changeLog: [],
      }),
    );

    await renderPage(SESSION_ID);
    const duration = await screen.findByLabelText('Durée (min)', {
      selector: '#module-duration-2',
    });
    await user.clear(duration);
    await user.type(duration, '30');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(await screen.findByText('Modifiée')).toBeInTheDocument();
    expect(bodies[0]).toMatchObject({
      modules: expect.arrayContaining([
        expect.objectContaining({ type: 'series', durationMinutes: 30 }),
      ]),
    });
  });

  it('affiche le conflit renvoyé par le back quand la séance est réalisée entre-temps', async () => {
    useFixtures();
    const user = userEvent.setup();
    trackModulesReplace(() => sessionProblem(409, 'SESSION_ALREADY_COMPLETED'));

    await renderPage(SESSION_ID);
    await user.click(await screen.findByRole('button', { name: 'Supprimer le module 1' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cette séance est réalisée : elle ne peut plus être modifiée.',
    );
  });
});
