import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const POST_SESSIONS_URL = /\/api\/sessions$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;

test.describe('Calendrier : glucides et hydratation d’une séance', () => {
  test('crée une séance avec sa cible de glucides et son hydratation', async ({ page }) => {
    await page.route(SLOTS_URL, (route) =>
      route.fulfill({ json: { from: '', to: '', items: [] } }),
    );
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'running', label: 'Course à pied' }] } }),
    );
    await page.route(SESSIONS_URL, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, json: { id: 'session-nutrition' } });
      }
      return route.fulfill({ json: { items: [] } });
    });

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await expect(calendrier.heading).toBeVisible();

    await page.getByRole('button', { name: 'Nouvelle séance', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Discipline').selectOption('running');
    await dialog.getByLabel('Durée (min)').fill('90');
    for (const [label, value] of [
      ['Z1 (%)', '10'],
      ['Z2 (%)', '20'],
      ['Z3 (%)', '40'],
      ['Z4 (%)', '20'],
      ['Z5 (%)', '10'],
    ] as const) {
      await dialog.getByLabel(label).fill(value);
    }
    await dialog.getByLabel('Glucides (g)').fill('60');
    await dialog.getByLabel('Unité des glucides').selectOption({ label: 'Par heure' });
    await dialog.getByLabel('Hydratation (ml)').fill('750');

    const createRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && POST_SESSIONS_URL.test(request.url()),
    );
    await dialog.getByRole('button', { name: 'Créer la séance', exact: true }).click();

    expect((await createRequest).postDataJSON()).toMatchObject({
      carbsGrams: 60,
      carbsUnit: 'par_heure',
      hydrationMilliliters: 750,
    });
  });
});
