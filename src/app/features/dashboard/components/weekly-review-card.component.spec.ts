import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { weeklyReviewApi } from '../../../../mocks/fixtures/weekly-review.fixtures';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { server } from '../../../../mocks/server';
import { WeeklyReviewApiService } from '../data-access/weekly-review.api';
import { WeeklyReviewState } from '../data-access/weekly-review.state';
import { WeeklyReviewCardComponent } from './weekly-review-card.component';

const REVIEW_URL = '*/api/weekly-reviews/:week';

function providers() {
  return [...statsTestProviders(), WeeklyReviewApiService, WeeklyReviewState];
}

describe('WeeklyReviewCardComponent', () => {
  it('affiche les trois parties du bilan', async () => {
    server.use(http.get(REVIEW_URL, () => HttpResponse.json(weeklyReviewApi)));

    await render(WeeklyReviewCardComponent, { providers: providers() });

    expect(await screen.findByText(weeklyReviewApi.suivi)).toBeInTheDocument();
    expect(screen.getByText(weeklyReviewApi.pointAttention)).toBeInTheDocument();
    expect(screen.getByText(weeklyReviewApi.conseil)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Régénérer' })).toBeEnabled();
  });

  it('propose de générer le bilan quand la semaine n’en a pas', async () => {
    const user = userEvent.setup();
    let generated = false;
    server.use(
      http.get(REVIEW_URL, () => new HttpResponse(null, { status: 404 })),
      http.post(REVIEW_URL, () => {
        generated = true;
        return HttpResponse.json(weeklyReviewApi, { status: 201 });
      }),
    );
    await render(WeeklyReviewCardComponent, { providers: providers() });

    await user.click(await screen.findByRole('button', { name: 'Générer le bilan' }));

    expect(await screen.findByText(weeklyReviewApi.conseil)).toBeInTheDocument();
    expect(generated).toBe(true);
  });

  it('demande une confirmation avant de régénérer', async () => {
    const user = userEvent.setup();
    server.use(http.get(REVIEW_URL, () => HttpResponse.json(weeklyReviewApi)));
    await render(WeeklyReviewCardComponent, { providers: providers() });

    await user.click(await screen.findByRole('button', { name: 'Régénérer' }));

    expect(await screen.findByText('Régénérer le bilan ?')).toBeInTheDocument();
    expect(screen.getByText('Le bilan actuel de cette semaine sera remplacé.')).toBeInTheDocument();
  });

  it('affiche le message d’erreur du back quand la chargement échoue', async () => {
    server.use(http.get(REVIEW_URL, () => new HttpResponse(null, { status: 500 })));

    await render(WeeklyReviewCardComponent, { providers: providers() });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });
});
