import { expect, test } from '@playwright/test';
import { normalStatsResponse } from '../../../src/mocks/fixtures/training-stats.fixtures';
import { dashboardKpisResponse } from '../../../src/mocks/fixtures/dashboard-kpis.fixtures';

const STATS_URL = /\/api\/stats(\?.*)?$/;
const KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;
const API_URL = /\/api\//;

test.describe('Tableau de bord : sélecteur de période', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(API_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(STATS_URL, (route) => route.fulfill({ json: normalStatsResponse }));
    await page.route(KPIS_URL, (route) => route.fulfill({ json: dashboardKpisResponse }));
  });

  test('le sélecteur marque la période active et change de période au clic', async ({ page }) => {
    await page.goto('/');

    const sevenDays = page.getByRole('button', { name: 'Semaine en cours' });
    const thirtyDays = page.getByRole('button', { name: 'Mois en cours' });
    await expect(sevenDays).toHaveAttribute('aria-pressed', 'true');
    await expect(thirtyDays).toHaveAttribute('aria-pressed', 'false');

    await thirtyDays.click();

    await expect(thirtyDays).toHaveAttribute('aria-pressed', 'true');
    await expect(sevenDays).toHaveAttribute('aria-pressed', 'false');
  });

  test('le bouton calendrier est présent mais désactivé', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('button', { name: 'Choisir des dates (bientôt disponible)' }),
    ).toBeDisabled();
  });
});
