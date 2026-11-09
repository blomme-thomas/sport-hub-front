import { expect, test } from '@playwright/test';
import { normalStatsResponse } from '../../../src/mocks/fixtures/training-stats.fixtures';
import { dashboardKpisResponse } from '../../../src/mocks/fixtures/dashboard-kpis.fixtures';

const LIST_URL = /\/api\/activities(\?.*)?$/;
const STATS_URL = /\/api\/stats(\?.*)?$/;
const KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;
const API_URL = /\/api\//;
const DETAIL_URL = /\/api\/activities\/act-1$/;

const activity = {
  id: 'act-1',
  garminActivityId: 'g-1',
  type: 'running',
  startedAt: new Date().toISOString(),
  durationSeconds: 3900,
  distanceMeters: 12400,
  averageHeartRate: 152,
};

test.describe('Dashboard : détails par séance', () => {
  test('ouvre le détail complet d’une séance au clic', async ({ page }) => {
    // Repli pour les appels non utiles ici (déclaré en premier, donc le moins prioritaire).
    await page.route(API_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(STATS_URL, (route) => route.fulfill({ json: normalStatsResponse }));
    await page.route(KPIS_URL, (route) => route.fulfill({ json: dashboardKpisResponse }));
    await page.route(LIST_URL, (route) =>
      route.fulfill({ json: { items: [activity], page: 1, pageSize: 4, total: 1 } }),
    );
    await page.route(DETAIL_URL, (route) =>
      route.fulfill({
        json: {
          id: 'act-1',
          garminActivityId: 'g-1',
          type: 'running',
          startedAt: activity.startedAt,
          durationSeconds: 3900,
          distanceMeters: 12400,
          calories: 820,
          elevationGainMeters: 95,
          averageHeartRate: 152,
          maxHeartRate: 171,
          hrTimeInZone: [600, 1200, 1500, 600],
          heartRateSeries: [
            { occurredAt: activity.startedAt, bpm: 140 },
            { occurredAt: activity.startedAt, bpm: 160 },
          ],
        },
      }),
    );

    await page.goto('/');

    await page.getByRole('button', { name: /Détail de la séance Course à pied/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Calories')).toBeVisible();
    await expect(dialog.getByText('820 kcal')).toBeVisible();
    await expect(dialog.getByText('Zone 3')).toBeVisible();
  });
});
