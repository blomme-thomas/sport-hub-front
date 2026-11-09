import { expect, test } from '@playwright/test';
import { normalStatsResponse } from '../../../src/mocks/fixtures/training-stats.fixtures';
import { dashboardKpisResponse } from '../../../src/mocks/fixtures/dashboard-kpis.fixtures';

const STATS_URL = /\/api\/stats(\?.*)?$/;
const KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;
const PROFILE_URL = /\/api\/profile$/;
const API_URL = /\/api\//;

test.describe('Tableau de bord : message d’accueil et sélecteur de période', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(API_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(STATS_URL, (route) => route.fulfill({ json: normalStatsResponse }));
    await page.route(KPIS_URL, (route) => route.fulfill({ json: dashboardKpisResponse }));
  });

  test('affiche Bonjour suivi du prénom et le sous-titre', async ({ page }) => {
    await page.route(PROFILE_URL, (route) => route.fulfill({ json: { displayName: 'Thomas' } }));

    await page.goto('/');

    await expect(page.getByText('Bonjour Thomas', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Voici un aperçu de vos entraînements et de votre progression.'),
    ).toBeVisible();
  });

  test('affiche Bonjour seul quand le profil est en erreur', async ({ page }) => {
    await page.route(PROFILE_URL, (route) =>
      route.fulfill({ status: 500, json: { code: 'INTERNAL_ERROR', status: 500 } }),
    );

    await page.goto('/');

    await expect(page.getByText('Bonjour', { exact: true })).toBeVisible();
  });

  test('le sélecteur marque la période active et change de période au clic', async ({ page }) => {
    await page.route(PROFILE_URL, (route) => route.fulfill({ json: { displayName: null } }));
    await page.goto('/');

    const sevenDays = page.getByRole('button', { name: '7 derniers jours' });
    const thirtyDays = page.getByRole('button', { name: '30 derniers jours' });
    await expect(sevenDays).toHaveAttribute('aria-pressed', 'true');
    await expect(thirtyDays).toHaveAttribute('aria-pressed', 'false');

    await thirtyDays.click();

    await expect(thirtyDays).toHaveAttribute('aria-pressed', 'true');
    await expect(sevenDays).toHaveAttribute('aria-pressed', 'false');
  });

  test('le bouton calendrier est présent mais désactivé', async ({ page }) => {
    await page.route(PROFILE_URL, (route) => route.fulfill({ json: { displayName: null } }));
    await page.goto('/');

    await expect(
      page.getByRole('button', { name: 'Choisir des dates (bientôt disponible)' }),
    ).toBeDisabled();
  });
});
