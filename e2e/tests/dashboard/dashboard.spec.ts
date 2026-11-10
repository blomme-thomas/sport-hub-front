import { expect, test } from '@playwright/test';
import {
  monthStatsResponse,
  normalStatsResponse,
} from '../../../src/mocks/fixtures/training-stats.fixtures';
import { dashboardKpisResponse } from '../../../src/mocks/fixtures/dashboard-kpis.fixtures';
import { DashboardPage } from '../../pages/dashboard.page';

const STATS_URL = /\/api\/stats(\?.*)?$/;
const KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;
const API_URL = /\/api\//;

test.describe('Tableau de bord', () => {
  let statsRequests: string[];
  let kpiPeriods: string[];

  test.beforeEach(async ({ page }) => {
    statsRequests = [];
    kpiPeriods = [];
    // Repli pour les autres appels (activités, objectifs, zones…) : déclaré en premier, donc le moins prioritaire.
    await page.route(API_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(KPIS_URL, (route) => {
      kpiPeriods.push(new URL(route.request().url()).searchParams.get('period') ?? '');
      return route.fulfill({ json: dashboardKpisResponse });
    });
    await page.route(STATS_URL, (route) => {
      const url = route.request().url();
      statsRequests.push(url);
      const granularity = new URL(url).searchParams.get('granularity');
      return route.fulfill({
        json: granularity === 'month' ? monthStatsResponse : normalStatsResponse,
      });
    });
  });

  test('affiche le nombre, la durée, la variation signée et la répartition de la période choisie', async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);

    await dashboard.goto();

    await expect(dashboard.heading).toBeVisible();
    await expect(dashboard.figure('Séances')).toContainText('Séances 5');
    await expect(dashboard.figure('Durée totale')).toContainText('6h 42');
    await expect(
      page.getByRole('heading', { name: 'Répartition par sport', exact: true }),
    ).toBeVisible();
  });

  test('choisir 3 mois recharge les statistiques par mois', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(
      page.getByRole('heading', { name: 'Répartition par sport', exact: true }),
    ).toBeVisible();

    const monthRequest = page.waitForRequest((request) =>
      request.url().includes('granularity=month'),
    );
    await dashboard.selectMonth();
    await monthRequest;

    await expect(dashboard.monthToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('Séances du mois')).toBeVisible();
    // Les indicateurs suivent la temporalité : la vue mois les demande sur 30 jours.
    await expect.poll(() => kpiPeriods.at(-1)).toBe('3m');
  });
});
