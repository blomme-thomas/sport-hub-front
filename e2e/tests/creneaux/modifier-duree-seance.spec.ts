import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';
import { currentWeekDay } from '../../support/week-dates';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const SESSION_URL = /\/api\/sessions\/session-course$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;

function sessionOccurrence(status: 'planifiee' | 'realisee') {
  return {
    sessionId: 'session-course',
    date: currentWeekDay(2),
    startTime: '18:00',
    durationMinutes: 45,
    disciplineTypeKey: 'running',
    recurrence: 'aucune',
    status,
  };
}

test.describe('Calendrier : modifier la durée d’une séance', () => {
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
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 72, { steps: 6 });
    await page.mouse.up();

    await page.waitForTimeout(300);
    expect(patchCalls).toBe(0);
  });
});
