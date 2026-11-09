import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const SESSION_URL = /\/api\/sessions\/session-course$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/disciplines$/;

function sessionOccurrence(status: 'planifiee' | 'realisee') {
  return {
    sessionId: 'session-course',
    date: '2026-11-12',
    startTime: '18:00',
    durationMinutes: 45,
    disciplineTypeKey: 'running',
    recurrence: 'aucune',
    status,
  };
}

test.describe('Calendrier : modifier la durée d’une séance', () => {
  test('change la durée depuis la vignette et enregistre la nouvelle durée', async ({ page }) => {
    let patched: Record<string, unknown> | undefined;
    await page.route(SLOTS_URL, (route) =>
      route.fulfill({ json: { from: '', to: '', items: [] } }),
    );
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'running', label: 'Course à pied' }] } }),
    );
    await page.route(SESSIONS_URL, (route) =>
      route.fulfill({ json: { items: [sessionOccurrence('planifiee')] } }),
    );
    await page.route(SESSION_URL, (route) => {
      if (route.request().method() === 'PATCH') {
        patched = route.request().postDataJSON() as Record<string, unknown>;
        return route.fulfill({ json: { id: 'session-course' } });
      }
      return route.fulfill({ status: 404, json: { code: 'SESSION_NOT_FOUND', status: 404 } });
    });

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();

    await page.getByRole('button', { name: /Modifier la durée de la séance 18:00/ }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Durée en minutes' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('spinbutton').fill('60');
    await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();

    await expect.poll(() => patched).toEqual({ durationMinutes: 60 });
    await expect(page.getByText('Durée modifiée.')).toBeVisible();
  });

  test('une séance réalisée n’a pas de bouton de durée et ne se glisse pas', async ({ page }) => {
    let patchCalls = 0;
    await page.route(SLOTS_URL, (route) =>
      route.fulfill({ json: { from: '', to: '', items: [] } }),
    );
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'running', label: 'Course à pied' }] } }),
    );
    await page.route(SESSIONS_URL, (route) =>
      route.fulfill({ json: { items: [sessionOccurrence('realisee')] } }),
    );
    await page.route(SESSION_URL, (route) => {
      if (route.request().method() === 'PATCH') {
        patchCalls += 1;
      }
      return route.fulfill({ json: { id: 'session-course' } });
    });

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();

    const seance = page.getByRole('button', {
      name: /^Séance Course à pied, 18:00 – 18:45, réalisée/,
    });
    await expect(seance).toBeVisible();
    await expect(seance).toContainText('Réalisée, déplacement impossible');
    await expect(page.getByRole('button', { name: /Modifier la durée/ })).toHaveCount(0);

    const box = await seance.boundingBox();
    if (box === null) {
      throw new Error('bloc de séance introuvable');
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 48, { steps: 6 });
    await page.mouse.up();

    await page.waitForTimeout(300);
    expect(patchCalls).toBe(0);
  });
});
