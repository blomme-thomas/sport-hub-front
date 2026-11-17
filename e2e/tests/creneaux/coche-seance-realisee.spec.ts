import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';
import { currentWeekDay } from '../../support/week-dates';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/disciplines$/;

function sessionOccurrence(sessionId: string, status: 'planifiee' | 'realisee', startTime: string) {
  return {
    sessionId,
    date: currentWeekDay(2),
    startTime,
    durationMinutes: 45,
    disciplineTypeKey: 'running',
    recurrence: 'aucune',
    status,
  };
}

test.describe('Calendrier : coche sur les séances réalisées', () => {
  test('affiche une coche verte sur la séance réalisée seulement', async ({ page }) => {
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
            sessionOccurrence('session-realisee', 'realisee', '08:00'),
            sessionOccurrence('session-planifiee', 'planifiee', '18:00'),
          ],
        },
      }),
    );

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();

    const realisee = page.getByRole('button', {
      name: /^Séance Course à pied, 08:00 – 08:45, réalisée/,
    });
    const planifiee = page.getByRole('button', { name: /^Séance Course à pied, 18:00 – 18:45/ });
    await expect(realisee.locator('.week-grid__done')).toBeVisible();
    await expect(planifiee.locator('.week-grid__done')).toHaveCount(0);
    await expect(realisee).toContainText('Réalisée, déplacement impossible');
  });
});
