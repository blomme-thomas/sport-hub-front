import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/disciplines$/;
const PAUSES_URL = /\/api\/pauses(\?.*)?$/;

test.describe('Calendrier : pauses', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(SLOTS_URL, (route) =>
      route.fulfill({ json: { from: '', to: '', items: [] } }),
    );
    await page.route(DISCIPLINES_URL, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(SESSIONS_URL, (route) => route.fulfill({ json: { items: [] } }));
  });

  test('crée une pause et affiche son bandeau sur le calendrier', async ({ page }) => {
    const pauses: Array<Record<string, unknown>> = [];
    let posted: Record<string, unknown> | undefined;
    await page.route(PAUSES_URL, (route) => {
      if (route.request().method() === 'POST') {
        posted = route.request().postDataJSON() as Record<string, unknown>;
        pauses.push({ id: 'pause-1', ...posted });
        return route.fulfill({ status: 201, json: pauses[0] });
      }
      return route.fulfill({ json: pauses });
    });

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Nouvelle pause', exact: true }).click();

    const dialog = page.getByRole('dialog').filter({ hasText: 'Motif' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Début', { exact: true }).fill('2026-12-20');
    await dialog.getByLabel('Fin', { exact: true }).fill('2027-01-05');
    await dialog.getByLabel('Blessure', { exact: true }).check();
    await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();

    await expect
      .poll(() => posted)
      .toEqual({
        startDate: '2026-12-20',
        endDate: '2027-01-05',
        reason: 'blessure',
      });
    await expect(page.getByText('Pause créée.')).toBeVisible();
  });

  test('signale une fin antérieure au début et bloque l’envoi', async ({ page }) => {
    let postCount = 0;
    await page.route(PAUSES_URL, (route) => {
      if (route.request().method() === 'POST') {
        postCount += 1;
      }
      return route.fulfill({ json: [] });
    });

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Nouvelle pause', exact: true }).click();

    const dialog = page.getByRole('dialog').filter({ hasText: 'Motif' });
    await dialog.getByLabel('Début', { exact: true }).fill('2026-12-20');
    await dialog.getByLabel('Fin', { exact: true }).fill('2026-12-10');
    await expect(dialog.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled();

    await expect(dialog.getByRole('alert')).toContainText('ne peut pas précéder le début');
    expect(postCount).toBe(0);
  });
});
