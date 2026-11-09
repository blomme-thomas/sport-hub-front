import { expect, test } from '@playwright/test';
import {
  monthStatsResponse,
  normalStatsResponse,
} from '../../../src/mocks/fixtures/training-stats.fixtures';

const STATS_URL = /\/api\/stats(\?.*)?$/;
const DASHBOARD_KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;

test.describe('Tableau de bord : métriques liées à la temporalité', () => {
  test('les indicateurs suivent Semaine (7 jours) et Mois (30 jours) du sélecteur', async ({
    page,
  }) => {
    const periods: string[] = [];
    await page.route(STATS_URL, (route) =>
      route.fulfill({
        json:
          new URL(route.request().url()).searchParams.get('granularity') === 'month'
            ? monthStatsResponse
            : normalStatsResponse,
      }),
    );
    await page.route(DASHBOARD_KPIS_URL, (route) => {
      periods.push(new URL(route.request().url()).searchParams.get('period') ?? '');
      return route.fulfill({ json: { kpis: [] } });
    });

    await page.goto('/');
    await expect.poll(() => periods.at(-1)).toBe('7d');

    await page.getByRole('button', { name: '30 derniers jours' }).click();
    await expect.poll(() => periods.at(-1)).toBe('30d');

    await page.getByRole('button', { name: '7 derniers jours' }).click();
    await expect.poll(() => periods.at(-1)).toBe('7d');
  });
});
