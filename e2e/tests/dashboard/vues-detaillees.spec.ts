import { expect, test } from '@playwright/test';
import { normalStatsResponse } from '../../../src/mocks/fixtures/training-stats.fixtures';
import { dashboardKpisResponse } from '../../../src/mocks/fixtures/dashboard-kpis.fixtures';
import { DashboardPage } from '../../pages/dashboard.page';

const STATS_URL = /\/api\/stats(\?.*)?$/;
const KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;
const API_URL = /\/api\//;

test.describe('Tableau de bord : vues détaillées en modale', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(API_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(KPIS_URL, (route) => route.fulfill({ json: dashboardKpisResponse }));
    await page.route(STATS_URL, (route) => route.fulfill({ json: normalStatsResponse }));
  });

  test('ouvre la vue détaillée des zones, puis la ferme avec Échap et rend le focus à la carte', async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const trigger = page.getByRole('button', { name: 'Agrandir : Zones d’entraînement' });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Zones d’entraînement' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('table', { name: 'Temps passé par zone de fréquence cardiaque' }),
    ).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('ouvre la vue détaillée de la répartition par sport', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await page.getByRole('button', { name: 'Agrandir : Répartition par sport' }).click();

    const dialog = page.getByRole('dialog', { name: 'Répartition par sport' });
    await expect(
      dialog.getByRole('table', { name: 'Répartition détaillée par sport' }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Fermer' }).click();
    await expect(dialog).toBeHidden();
  });

  test('ouvre la vue détaillée d’un indicateur', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await page.getByRole('button', { name: 'Agrandir : Séances' }).click();

    const dialog = page.getByRole('dialog', { name: 'Séances' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText('Variation par rapport à la période précédente : —'),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Fermer' }).click();
    await expect(dialog).toBeHidden();
  });
});
