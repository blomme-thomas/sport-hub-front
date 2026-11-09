import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const SESSION_URL = /\/api\/sessions\/session-course$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/disciplines$/;

test.describe('Calendrier : déplacer une séance', () => {
  test('glisse une séance ponctuelle d’une heure plus tard et enregistre la nouvelle heure', async ({
    page,
  }) => {
    let patched: Record<string, unknown> | undefined;
    await page.route(SLOTS_URL, (route) =>
      route.fulfill({ json: { from: '', to: '', items: [] } }),
    );
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'running', label: 'Course à pied' }] } }),
    );
    await page.route(SESSIONS_URL, (route) =>
      route.fulfill({
        json: {
          items: [
            {
              sessionId: 'session-course',
              date: '2026-11-12',
              startTime: '18:00',
              durationMinutes: 45,
              disciplineTypeKey: 'running',
              recurrence: 'aucune',
              status: 'planifiee',
            },
          ],
        },
      }),
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

    const seance = page.getByRole('button', { name: /^Séance Course à pied, 18:00/ });
    await expect(seance).toBeVisible();
    // La séance de 18:00 est sous la ligne de flottaison : on fait défiler la page jusqu'à elle.
    await seance.scrollIntoViewIfNeeded();
    const box = await seance.boundingBox();
    if (box === null) {
      throw new Error('bloc de séance introuvable');
    }

    // Une heure dans la grille = 48 px ; on glisse d'une heure vers le bas.
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 24, { steps: 4 });
    await page.mouse.move(startX, startY + 48, { steps: 4 });
    await page.mouse.up();

    await expect.poll(() => patched).toMatchObject({ startTime: '19:00' });
  });
});
