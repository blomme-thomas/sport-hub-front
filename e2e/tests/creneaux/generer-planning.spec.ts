import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/disciplines$/;
const GENERATE_URL = /\/api\/planning\/generate$/;

test.describe('Calendrier : générer le planning', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(SLOTS_URL, (route) =>
      route.fulfill({ json: { from: '', to: '', items: [] } }),
    );
    await page.route(DISCIPLINES_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(SESSIONS_URL, (route) => route.fulfill({ json: { items: [] } }));
  });

  test('génère la semaine affichée et recharge le calendrier', async ({ page }) => {
    let body: Record<string, unknown> | undefined;
    await page.route(GENERATE_URL, (route) => {
      body = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        json: {
          from: body['from'],
          to: body['to'],
          items: [
            { id: 's1', date: body['from'], disciplineTypeKey: 'swimming', durationMinutes: 60 },
          ],
        },
      });
    });

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Générer le planning', exact: true }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Période à planifier' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Générer', exact: true }).click();

    await expect.poll(() => body).toBeDefined();
    const from = String(body?.['from']);
    const to = String(body?.['to']);
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Date.parse(to) - Date.parse(from)).toBe(6 * 24 * 60 * 60 * 1000);
    await expect(page.getByText(/1 séance\(s\) générée\(s\)\./)).toBeVisible();
  });

  test('affiche l’erreur du back et garde la modale ouverte sans perdre le calendrier', async ({
    page,
  }) => {
    await page.route(GENERATE_URL, (route) =>
      route.fulfill({
        status: 503,
        json: {
          code: 'PLANNING_UNAVAILABLE',
          status: 503,
          title: 'Indisponible',
          detail: 'Réessayez plus tard.',
        },
      }),
    );

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Générer le planning', exact: true }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Période à planifier' });
    await dialog.getByRole('button', { name: 'Générer', exact: true }).click();

    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Calendrier', level: 1 })).toBeVisible();
  });
});
