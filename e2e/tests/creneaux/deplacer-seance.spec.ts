import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';
import { currentWeekDay } from '../../support/week-dates';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const SESSION_URL = /\/api\/sessions\/session-course$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;

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
              date: currentWeekDay(2),
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

    // Une heure dans la grille : on la mesure entre deux libellés d'heure (la hauteur s'adapte à la fenêtre).
    const [firstHour, secondHour] = await Promise.all([
      page.locator('.week-grid__hour').nth(0).boundingBox(),
      page.locator('.week-grid__hour').nth(1).boundingBox(),
    ]);
    if (firstHour === null || secondHour === null) {
      throw new Error('libellés d’heures introuvables');
    }
    const hourPx = secondHour.y - firstHour.y;
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + hourPx / 3, { steps: 4 });
    await page.mouse.move(startX, startY + hourPx, { steps: 4 });
    await page.mouse.up();

    await expect.poll(() => patched).toMatchObject({ startTime: '19:00' });
  });
});
