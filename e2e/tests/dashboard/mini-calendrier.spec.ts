import { expect, test } from '@playwright/test';
import {
  monthStatsResponse,
  normalStatsResponse,
} from '../../../src/mocks/fixtures/training-stats.fixtures';
import { dashboardKpisResponse } from '../../../src/mocks/fixtures/dashboard-kpis.fixtures';

const API_URL = /\/api\//;
const STATS_URL = /\/api\/stats(\?.*)?$/;
const KPIS_URL = /\/api\/stats\/dashboard(\?.*)?$/;
const PROFILE_URL = /\/api\/profile$/;
const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;

test.describe('Tableau de bord : mini-calendrier de la semaine', () => {
  test.beforeEach(async ({ page }) => {
    // Catch-all enregistré en premier : sans back en CI, toute requête non mockée ferait passer la page en erreur.
    await page.route(API_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(KPIS_URL, (route) => route.fulfill({ json: dashboardKpisResponse }));
    await page.route(PROFILE_URL, (route) => route.fulfill({ json: { displayName: null } }));
    await page.route(STATS_URL, (route) =>
      route.fulfill({
        json:
          new URL(route.request().url()).searchParams.get('granularity') === 'month'
            ? monthStatsResponse
            : normalStatsResponse,
      }),
    );
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({
        json: { items: [{ typeKey: 'running', label: 'Course à pied' }] },
      }),
    );
  });

  test('affiche une icône par séance planifiée et ouvre la fiche au clic', async ({ page }) => {
    // Les séances sont placées sur la semaine demandée (paramètre `from`), quel que soit le jour d'exécution.
    await page.route(SESSIONS_URL, (route) => {
      const from = new URL(route.request().url()).searchParams.get('from') ?? '';
      const wednesday = addDays(from, 2);
      return route.fulfill({
        json: {
          items: [
            {
              sessionId: 'session-course',
              date: wednesday,
              startTime: '18:00',
              durationMinutes: 45,
              disciplineTypeKey: 'running',
              recurrence: 'aucune',
              status: 'planifiee',
            },
            {
              sessionId: 'session-faite',
              date: wednesday,
              startTime: '07:00',
              durationMinutes: 45,
              disciplineTypeKey: 'running',
              recurrence: 'aucune',
              status: 'realisee',
            },
          ],
        },
      });
    });

    await page.goto('/');

    const miniCalendar = page
      .getByRole('region', { name: 'Calendrier' })
      .or(page.locator('sh-week-mini-calendar'));
    await expect(miniCalendar.getByRole('heading', { name: 'Calendrier' })).toBeVisible();
    // La séance réalisée n'apparaît pas : une seule icône dans le bloc.
    const icons = miniCalendar.getByRole('button', { name: /^Séance Course à pied/ });
    await expect(icons).toHaveCount(1);
    await expect(icons).toHaveAttribute(
      'aria-label',
      'Séance Course à pied, 18:00. Ouvrir la séance',
    );

    await icons.click();
    await expect(page).toHaveURL(/\/seances\/session-course$/);
  });
  test('la grille affiche le mois entier, avec aujourd’hui et la semaine en cours surlignés', async ({
    page,
  }) => {
    await page.route(SESSIONS_URL, (route) => route.fulfill({ json: { items: [] } }));

    await page.goto('/');
    const miniCalendar = page.locator('sh-week-mini-calendar');
    await expect(miniCalendar.locator('.week-mini__weekdays li')).toHaveCount(7);
    const monthCells = await miniCalendar.locator('.week-mini__day').count();
    expect([28, 35, 42]).toContain(monthCells);
    await expect(miniCalendar.locator('.week-mini__day--today')).toHaveCount(1);
    await expect(miniCalendar.locator('.week-mini__day--current-week')).toHaveCount(7);
  });
});

/** Ajoute `days` jours à une date `YYYY-MM-DD`, en UTC. */
function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
