import { expect, test } from '@playwright/test';
import { normalStatsResponse } from '../../../src/mocks/fixtures/training-stats.fixtures';
import { dashboardKpisResponse } from '../../../src/mocks/fixtures/dashboard-kpis.fixtures';
import { DashboardPage } from '../../pages/dashboard.page';

const STATS_URL = /\/api\/stats(\?.*)?$/;
const KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;
const API_URL = /\/api\//;

test.describe('Tableau de bord : carte Zones d’entraînement', () => {
  test('affiche la légende des zones et le message de statut dérivé de la zone optimale', async ({
    page,
  }) => {
    // Repli déclaré en premier (le moins prioritaire), puis les routes du tableau de bord.
    await page.route(API_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(KPIS_URL, (route) => route.fulfill({ json: dashboardKpisResponse }));
    await page.route(STATS_URL, (route) => route.fulfill({ json: normalStatsResponse }));

    // Fixture : Z2 + Z3 = 4800 s sur 6300 s, soit 76 % en zone optimale (au-dessus du seuil de 60 %).
    const dashboard = new DashboardPage(page);

    await dashboard.goto();

    await expect(page.getByRole('heading', { name: 'Zones d’entraînement' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Légende des zones cardiaques' })).toContainText(
      'Z3',
    );
    await expect(page.getByRole('status').filter({ hasText: 'Bon équilibre' })).toBeVisible();
  });
});
