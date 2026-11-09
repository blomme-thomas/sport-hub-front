import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const CANCEL_URL = /\/api\/sessions\/session-piscine\/occurrences\/2026-11-09\/cancel$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/disciplines$/;

test.describe('Calendrier : une occurrence de séance hebdomadaire', () => {
  test('annule cette semaine seulement', async ({ page }) => {
    let cancelled = false;
    await page.route(SLOTS_URL, (route) =>
      route.fulfill({ json: { from: '', to: '', items: [] } }),
    );
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'lap_swimming', label: 'Piscine' }] } }),
    );
    await page.route(SESSIONS_URL, (route) =>
      route.fulfill({
        json: {
          items: [
            {
              sessionId: 'session-piscine',
              date: '2026-11-09',
              startTime: '18:00',
              durationMinutes: 60,
              disciplineTypeKey: 'lap_swimming',
              recurrence: 'hebdomadaire',
              status: cancelled ? 'annulee' : 'planifiee',
            },
          ],
        },
      }),
    );
    await page.route(CANCEL_URL, (route) => {
      cancelled = true;
      return route.fulfill({ status: 201, json: {} });
    });

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();

    await page.getByRole('button', { name: /^Séance Piscine, 18:00/ }).click();
    const cancelRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && CANCEL_URL.test(request.url()),
    );
    await page.getByRole('button', { name: 'Annuler cette semaine', exact: true }).click();

    await cancelRequest;
    expect(cancelled).toBe(true);
  });
});
