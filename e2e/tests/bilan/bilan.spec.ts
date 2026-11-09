import { expect, test } from '@playwright/test';

const REVIEW_URL = /\/api\/weekly-reviews\/[0-9]{4}-W[0-9]{2}$/;

const review = {
  week: '2026-W46',
  suivi: 'Trois séances prévues, deux réalisées.',
  pointAttention: 'Séance de séries manquée jeudi.',
  conseil: 'Garde une sortie facile en fin de semaine.',
  source: 'claude',
  model: 'claude-sonnet-5-5',
  generatedAt: '2026-11-09T18:30:00.000Z',
};

// Carte masquée tant que le token IA n'est pas disponible (drapeau weeklyReviewEnabled du tableau de bord).
test.describe.skip('Bilan de la semaine', () => {
  test('affiche les trois parties du bilan de la semaine', async ({ page }) => {
    await page.route(REVIEW_URL, (route) => route.fulfill({ json: review }));

    await page.goto('/');

    const card = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: 'Bilan de la semaine' }) });
    await expect(card.getByText(review.suivi)).toBeVisible();
    await expect(card.getByText(review.pointAttention)).toBeVisible();
    await expect(card.getByText(review.conseil)).toBeVisible();
  });

  test('propose de générer un bilan pour une semaine sans bilan', async ({ page }) => {
    let generated = false;
    await page.route(REVIEW_URL, (route) => {
      if (route.request().method() === 'POST') {
        generated = true;
        return route.fulfill({ status: 201, json: review });
      }
      return route.fulfill({ status: 404, json: { code: 'WEEKLY_REVIEW_NOT_FOUND', status: 404 } });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Générer le bilan' }).click();

    await expect(page.getByText(review.conseil)).toBeVisible();
    expect(generated).toBe(true);
  });
});
