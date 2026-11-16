import { expect, test } from '@playwright/test';
import { normalStatsResponse } from '../../../src/mocks/fixtures/training-stats.fixtures';
import { dashboardKpisResponse } from '../../../src/mocks/fixtures/dashboard-kpis.fixtures';

const API_URL = /\/api\//;
const STATS_URL = /\/api\/stats(\?.*)?$/;
const KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;
const PROFILE_URL = /\/api\/profile$/;

/** Largeurs de la maquette : mobile étroit, mobile, tablette, desktop étroit, desktop large. */
const WIDTHS = [360, 768, 1024, 1440];

test.describe('Tableau de bord : responsive', () => {
  test.beforeEach(async ({ page }) => {
    // Catch-all enregistré en premier : sans back en CI, toute requête non mockée ferait passer la page en erreur.
    await page.route(API_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(STATS_URL, (route) => route.fulfill({ json: normalStatsResponse }));
    await page.route(KPIS_URL, (route) => route.fulfill({ json: dashboardKpisResponse }));
    await page.route(PROFILE_URL, (route) => route.fulfill({ json: { displayName: null } }));
  });

  for (const width of WIDTHS) {
    test(`aucun défilement horizontal à ${width} px de large`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible();
      // Attente de la fin du chargement des cartes avant la mesure.
      await expect(page.getByRole('region', { name: 'Indicateurs de la période' })).toBeVisible();

      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(
        overflow.scroll,
        `scrollWidth ${overflow.scroll} > clientWidth ${overflow.client}`,
      ).toBeLessThanOrEqual(overflow.client);
    });
  }

  test('les animations sont désactivées quand l’utilisateur demande moins de mouvement', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Indicateurs de la période' })).toBeVisible();

    const duration = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.transition = 'opacity 1s';
      document.body.append(probe);
      const value = getComputedStyle(probe).transitionDuration;
      probe.remove();
      return value;
    });
    // La durée est ramenée à une quasi-nulle (0.01 ms) au lieu de 1 s.
    expect(parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000)).toBeLessThan(0.1);
  });
});
