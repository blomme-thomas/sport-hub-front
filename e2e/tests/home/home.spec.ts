import { expect, test } from '@playwright/test';
import { HomePage } from '../../pages/home.page';

test.describe("Page d'accueil", () => {
  test("affiche la coque et le titre de l'application", async ({ page }) => {
    const home = new HomePage(page);

    await home.goto();

    await expect(home.heading).toBeVisible();
    await expect(home.brandLink).toBeVisible();
  });

  test('affiche la page introuvable pour une route inconnue', async ({ page }) => {
    await page.goto('/route-inconnue');

    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
  });
});
