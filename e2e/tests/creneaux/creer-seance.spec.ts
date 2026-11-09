import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const POST_SESSIONS_URL = /\/api\/sessions$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/disciplines$/;

test.describe('Calendrier : créer une séance', () => {
  test('crée une séance depuis le calendrier et ouvre sa fiche', async ({ page }) => {
    await page.route(SLOTS_URL, (route) =>
      route.fulfill({ json: { from: '', to: '', items: [] } }),
    );
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'running', label: 'Course à pied' }] } }),
    );
    await page.route(SESSIONS_URL, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, json: { id: 'session-nouvelle' } });
      }
      return route.fulfill({ json: { items: [] } });
    });

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await expect(calendrier.heading).toBeVisible();

    await page.getByRole('button', { name: 'Nouvelle séance', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Discipline').selectOption('running');
    await dialog.getByLabel('Durée (min)').fill('45');

    const createRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && POST_SESSIONS_URL.test(request.url()),
    );
    await dialog.getByRole('button', { name: 'Créer la séance', exact: true }).click();

    const body = (await createRequest).postDataJSON() as Record<string, unknown>;
    expect(body).toMatchObject({
      disciplineTypeKey: 'running',
      durationMinutes: 45,
      recurrence: 'aucune',
    });
    await expect(page).toHaveURL(/\/seances\/session-nouvelle$/);
  });
});
