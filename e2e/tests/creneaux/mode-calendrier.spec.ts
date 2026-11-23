import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const PAUSES_URL = /\/api\/pauses(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;

test.describe('Calendrier : mode Séances et Alimentation', () => {
  test('bascule en mode alimentation sans changer d’URL, puis revient aux séances', async ({
    page,
  }) => {
    await page.route(SLOTS_URL, (route) =>
      route.fulfill({ json: { from: '', to: '', items: [] } }),
    );
    await page.route(SESSIONS_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(PAUSES_URL, (route) => route.fulfill({ json: [] }));
    await page.route(DISCIPLINES_URL, (route) => route.fulfill({ json: { items: [] } }));

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await expect(calendrier.heading).toBeVisible();
    const nouvelleSeance = page.getByRole('button', { name: 'Nouvelle séance', exact: true });
    await expect(nouvelleSeance).toBeVisible();

    await page.getByRole('button', { name: 'Alimentation', exact: true }).click();

    await expect(page).toHaveURL(/\/creneaux$/);
    const grille = page.getByRole('table', { name: 'Repas de la semaine' });
    await expect(grille).toBeVisible();
    await expect(grille.getByRole('rowheader', { name: 'Matin' })).toBeVisible();
    await expect(grille.getByRole('rowheader', { name: 'Midi' })).toBeVisible();
    await expect(grille.getByRole('rowheader', { name: 'Soir' })).toBeVisible();
    await expect(nouvelleSeance).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Aujourd’hui', exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Alimentation', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.getByRole('button', { name: 'Séances', exact: true }).click();

    await expect(nouvelleSeance).toBeVisible();
    await expect(page.getByRole('table', { name: 'Repas de la semaine' })).toHaveCount(0);
  });
});
