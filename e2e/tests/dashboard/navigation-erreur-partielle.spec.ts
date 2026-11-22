import { expect, test } from '@playwright/test';
import { normalStatsResponse } from '../../../src/mocks/fixtures/training-stats.fixtures';
import { dashboardKpisResponse } from '../../../src/mocks/fixtures/dashboard-kpis.fixtures';

const API_URL = /\/api\//;
const STATS_URL = /\/api\/stats(\?.*)?$/;
const KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;
const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;

test.describe('Tableau de bord : navigation du calendrier et erreur partielle', () => {
  test.beforeEach(async ({ page }) => {
    // Catch-all enregistré en premier : sans back en CI, toute requête non mockée ferait passer la page en erreur.
    await page.route(API_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(STATS_URL, (route) => route.fulfill({ json: normalStatsResponse }));
    await page.route(KPIS_URL, (route) => route.fulfill({ json: dashboardKpisResponse }));
  });

  test('Précédent charge la semaine d’avant, à sept jours du début de la semaine affichée', async ({
    page,
  }) => {
    const froms: string[] = [];
    await page.route(SESSIONS_URL, (route) => {
      froms.push(new URL(route.request().url()).searchParams.get('from') ?? '');
      return route.fulfill({ json: { items: [] } });
    });

    await page.goto('/');
    await expect.poll(() => froms.length).toBeGreaterThan(0);
    // La semaine courante peut être demandée plusieurs fois au chargement : on prend la plus récente comme référence.
    const before = froms.reduce((latest, from) => (from > latest ? from : latest), '');

    await page.getByRole('button', { name: 'Précédent', exact: true }).click();

    // Le calendrier remonte dans le temps : une requête démarre avant la référence.
    await expect.poll(() => froms.some((from) => from < before)).toBe(true);
  });

  test('une erreur des indicateurs n’efface ni la page ni le calendrier', async ({ page }) => {
    await page.route(KPIS_URL, (route) =>
      route.fulfill({
        status: 500,
        json: {
          type: 'urn:test',
          title: 'Erreur',
          status: 500,
          detail: 'Erreur',
          code: 'INTERNAL_ERROR',
        },
      }),
    );

    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Indicateurs de la période' }).getByRole('alert'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Réessayer' }).first()).toBeVisible();
    await expect(page.locator('sh-week-mini-calendar')).toBeVisible();
  });
});
