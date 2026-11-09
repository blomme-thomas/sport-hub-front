import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/disciplines$/;

test.describe('Calendrier : séances', () => {
  test('affiche une séance de la semaine avec le nom de sa discipline et ouvre sa fiche', async ({
    page,
  }) => {
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

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await expect(calendrier.heading).toBeVisible();

    const seance = page.getByRole('button', { name: /^Séance Course à pied, 18:00/ });
    await expect(seance).toBeVisible();
    await seance.click();
    await page.getByRole('button', { name: 'Ouvrir la fiche', exact: true }).click();

    await expect(page).toHaveURL(/\/seances\/session-course$/);
  });
});
