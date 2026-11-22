// Squelette — à copier dans e2e/tests/<feature>/<scenario>.spec.ts puis adapter.
// Exclu du build/lint/test unitaire (voir instructions/11, section "Templates de code").
// Référence : instructions/09b-e2e-testing.instructions.md
//
// Scénario utilisateur : la spec ne contient que le parcours, les sélecteurs sont dans le page object.

import { expect, test } from '@playwright/test';
// import { ActivitiesPage } from '../../pages/activities.page';

test.describe('Liste des activités', () => {
  test.beforeEach(async ({ page }) => {
    // Isoler le back (alternative : handlers MSW partagés)
    await page.route('**/activities', (route) =>
      route.fulfill({
        json: [{ id: 'a1', sport: 'running', startTime: '2026-10-01T07:30:00Z', durationSeconds: 3600, distanceMeters: 10000 }],
      }),
    );
  });

  test('affiche les activités récentes', async ({ page }) => {
    // const activities = new ActivitiesPage(page);
    // await activities.goto();
    await page.goto('/activities');

    await expect(page.getByRole('heading', { name: 'Activités' })).toBeVisible();
    await expect(page.getByText('10.0 km')).toBeVisible();
  });

  test('affiche un message d\'erreur si l\'API échoue', async ({ page }) => {
    await page.route('**/activities', (route) => route.fulfill({ status: 500 }));

    await page.goto('/activities');

    await expect(page.getByRole('alert')).toBeVisible();
  });
});
