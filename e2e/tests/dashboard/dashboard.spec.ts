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
const SESSIONS_WEEK_TITLE = 'Séances par semaine';
const SESSIONS_MONTH_TITLE = 'Séances par mois';

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

  test('bascule de Semaine à Mois et recharge les statistiques par mois', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.card(SESSIONS_WEEK_TITLE)).toBeVisible();

    const monthRequest = page.waitForRequest((request) =>
      request.url().includes('granularity=month'),
    );
    await dashboard.selectMonth();
    await monthRequest;

    await expect(dashboard.monthToggle).toBeChecked();
    await expect(dashboard.card(SESSIONS_MONTH_TITLE)).toBeVisible();
    // Les indicateurs suivent la temporalité : la vue mois les demande sur 30 jours.
    await expect.poll(() => kpiPeriods.at(-1)).toBe('30d');
  });

  test('ouvre le graphique agrandi sans nouvel appel au back', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.figure('Séances')).toContainText('Séances 5');
    expect(statsRequests).toHaveLength(1);

    await dashboard.openChart(SESSIONS_WEEK_TITLE);

    await expect(dashboard.dialog(SESSIONS_WEEK_TITLE)).toBeVisible();
    await expect(
      dashboard.dialog(SESSIONS_WEEK_TITLE).getByRole('img', { name: SESSIONS_WEEK_TITLE }),
    ).toBeVisible();
    expect(statsRequests).toHaveLength(1);
  });

  test('ferme la modale avec la touche Échap et restitue le focus à la carte', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.figure('Séances')).toContainText('Séances 5');
    await dashboard.openChart(SESSIONS_WEEK_TITLE);
    await expect(dashboard.dialog(SESSIONS_WEEK_TITLE)).toBeVisible();

    await dashboard.closeWithEscape();

    await expect(dashboard.dialog(SESSIONS_WEEK_TITLE)).toBeHidden();
    await expect(dashboard.expandButton(SESSIONS_WEEK_TITLE)).toBeFocused();
  });

  test('ferme la modale avec le bouton Fermer et restitue le focus à la carte', async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.figure('Séances')).toContainText('Séances 5');
    await dashboard.openChart(SESSIONS_WEEK_TITLE);
    await expect(dashboard.dialog(SESSIONS_WEEK_TITLE)).toBeVisible();

    await dashboard.closeWithButton(SESSIONS_WEEK_TITLE);

    await expect(dashboard.dialog(SESSIONS_WEEK_TITLE)).toBeHidden();
    await expect(dashboard.expandButton(SESSIONS_WEEK_TITLE)).toBeFocused();
  });
});
