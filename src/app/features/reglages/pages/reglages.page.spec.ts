import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { server } from '../../../../mocks/server';
import { ReglagesPage } from './reglages.page';

const SETTINGS_URL = '*/api/settings';

function setup() {
  return render(ReglagesPage, { providers: statsTestProviders() });
}

function withTarget(seconds: number | null) {
  server.use(http.get(SETTINGS_URL, () => HttpResponse.json({ weeklyTargetSeconds: seconds })));
}

describe('ReglagesPage : objectif de la semaine', () => {
  it('indique l’absence de cible quand aucune n’est enregistrée', async () => {
    withTarget(null);
    await setup();

    expect(await screen.findByText('Aucun objectif hebdomadaire défini.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retirer l’objectif' })).toBeDisabled();
  });

  it('affiche la cible enregistrée et ses champs pré-remplis', async () => {
    withTarget(28800);
    await setup();

    expect(await screen.findByText('8h 00')).toBeInTheDocument();
    expect(screen.getByLabelText('Heures')).toHaveValue(8);
    expect(screen.getByLabelText('Minutes')).toHaveValue(0);
  });

  it('enregistre la cible saisie en secondes, qui reste ensuite la même', async () => {
    withTarget(null);
    const bodies: unknown[] = [];
    server.use(
      http.put(SETTINGS_URL, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ weeklyTargetSeconds: 28800 });
      }),
    );
    await setup();

    await userEvent.clear(await screen.findByLabelText('Heures'));
    await userEvent.type(screen.getByLabelText('Heures'), '8');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Cible enregistrée.')).toBeInTheDocument();
    expect(bodies).toEqual([{ weeklyTargetSeconds: 28800 }]);
  });

  it('refuse une durée nulle sans rien envoyer', async () => {
    withTarget(null);
    const requests: string[] = [];
    server.use(
      http.put(SETTINGS_URL, () => {
        requests.push('PUT');
        return HttpResponse.json({ weeklyTargetSeconds: 0 });
      }),
    );
    await setup();

    await userEvent.click(await screen.findByRole('button', { name: 'Enregistrer' }));

    expect(
      screen.getByText('Indiquez une durée d’au moins une minute, avec des minutes entre 0 et 59.'),
    ).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it('retire la cible au clic sur « Retirer l’objectif », en envoyant null', async () => {
    withTarget(28800);
    const bodies: unknown[] = [];
    server.use(
      http.put(SETTINGS_URL, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ weeklyTargetSeconds: null });
      }),
    );
    await setup();

    await userEvent.click(await screen.findByRole('button', { name: 'Retirer l’objectif' }));

    expect(await screen.findByText('Aucun objectif hebdomadaire défini.')).toBeInTheDocument();
    expect(bodies).toEqual([{ weeklyTargetSeconds: null }]);
  });
});
