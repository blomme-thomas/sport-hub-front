import { expect, test } from '@playwright/test';
import { NutritionPage } from '../../pages/nutrition.page';

test.describe('Nutrition', () => {
  test('ouvre la page depuis le menu et change d’onglet au clavier', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Nutrition', exact: true }).click();

    const nutrition = new NutritionPage(page);
    await expect(nutrition.heading).toBeVisible();
    await expect(page).toHaveURL(/\/nutrition$/);
    await expect(nutrition.recipesTab).toHaveAttribute('aria-selected', 'true');

    await nutrition.recipesTab.focus();
    await page.keyboard.press('ArrowRight');

    await expect(nutrition.foodsTab).toHaveAttribute('aria-selected', 'true');
    await expect(nutrition.foodsTab).toBeFocused();
    await expect(page).toHaveURL(/\/nutrition\?onglet=aliments$/);
  });

  test('restaure l’onglet choisi après rechargement', async ({ page }) => {
    const nutrition = new NutritionPage(page);
    await nutrition.goto();
    await nutrition.foodsTab.click();

    await page.reload();

    await expect(nutrition.foodsTab).toHaveAttribute('aria-selected', 'true');
    await expect(nutrition.recipesTab).toHaveAttribute('aria-selected', 'false');
  });
});
