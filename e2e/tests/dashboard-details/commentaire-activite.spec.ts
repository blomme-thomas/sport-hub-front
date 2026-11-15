import { expect, test, type Page } from '@playwright/test';
import { normalStatsResponse } from '../../../src/mocks/fixtures/training-stats.fixtures';
import { dashboardKpisResponse } from '../../../src/mocks/fixtures/dashboard-kpis.fixtures';

const LIST_URL = /\/api\/activities(\?.*)?$/;
const STATS_URL = /\/api\/stats(\?.*)?$/;
const KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;
const API_URL = /\/api\//;
const DETAIL_URL = /\/api\/activities\/act-1$/;
const COMMENT_URL = /\/api\/activities\/act-1\/comment$/;

const startedAt = new Date().toISOString();

const activity = {
  id: 'act-1',
  garminActivityId: 'g-1',
  type: 'running',
  startedAt,
  durationSeconds: 3900,
  distanceMeters: 12400,
  averageHeartRate: 152,
};

const generatedComment = {
  activityId: 'act-1',
  text: 'Sortie régulière, allure stable dans la zone visée.',
  source: 'ia',
  model: 'claude-sonnet-5-5',
  generatedAt: startedAt,
};

const regeneratedComment = { ...generatedComment, text: 'Nouvelle lecture : la fin a décroché.' };

/** Routes communes au tableau de bord et au détail de l'activité `act-1`. */
async function mockDashboard(page: Page): Promise<void> {
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
        ...activity,
        calories: 820,
        elevationGainMeters: 95,
        maxHeartRate: 171,
        hrTimeInZone: [600, 1200, 1500, 600],
        heartRateSeries: [],
      },
    }),
  );
}

test.describe('Dashboard : commentaire d’une activité', () => {
  test('génère le commentaire d’une activité qui n’en a pas', async ({ page }) => {
    let stored = false;
    await mockDashboard(page);
    await page.route(COMMENT_URL, (route) => {
      if (route.request().method() === 'POST') {
        stored = true;
        return route.fulfill({ status: 201, json: generatedComment });
      }
      return stored
        ? route.fulfill({ json: generatedComment })
        : route.fulfill({
            status: 404,
            json: { code: 'ACTIVITY_COMMENT_NOT_FOUND', status: 404 },
          });
    });

    await page.goto('/');
    await page.getByRole('button', { name: /Détail de la séance Course à pied/ }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Générer le commentaire' }).click();

    await expect(dialog.getByText(generatedComment.text)).toBeVisible();
    expect(stored).toBe(true);
  });

  test('régénère le commentaire après confirmation', async ({ page }) => {
    let current = generatedComment;
    let regenerated = false;
    await mockDashboard(page);
    await page.route(COMMENT_URL, (route) => {
      if (route.request().method() === 'POST') {
        regenerated = true;
        current = regeneratedComment;
        return route.fulfill({ status: 201, json: current });
      }
      return route.fulfill({ json: current });
    });

    await page.goto('/');
    await page.getByRole('button', { name: /Détail de la séance Course à pied/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(generatedComment.text)).toBeVisible();

    await dialog.getByRole('button', { name: 'Régénérer' }).click();
    expect(regenerated).toBe(false);
    await dialog.getByRole('button', { name: 'Confirmer la régénération' }).click();

    await expect(dialog.getByText(regeneratedComment.text)).toBeVisible();
    expect(regenerated).toBe(true);
  });
});
