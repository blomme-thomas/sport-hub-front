import { expect, test } from '@playwright/test';
import { SessionPage } from '../../pages/session.page';

const SESSION_URL = /\/api\/sessions\/session-course$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;

const session = {
  id: 'session-course',
  date: '2026-11-12',
  disciplineTypeKey: 'course_a_pied',
  durationMinutes: 45,
  startTime: '18:00',
  recurrence: 'aucune',
  status: 'planifiee',
  modifiedManually: false,
  description: null,
  title: null,
  targetDistanceMeters: null,
  targetHrZonePercentages: null,
  carbsGrams: null,
  carbsUnit: null,
  hydrationMilliliters: null,
  modules: [],
  changeLog: [],
  achievement: null,
  activity: null,
};

test.describe('Fiche de séance : glucides et hydratation', () => {
  test('modifie la cible de glucides et l’hydratation, puis enregistre la séance', async ({
    page,
  }) => {
    let patched: Record<string, unknown> | undefined;
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'course_a_pied', label: 'Course à pied' }] } }),
    );
    await page.route(SESSION_URL, (route) => {
      if (route.request().method() === 'PATCH') {
        patched = route.request().postDataJSON() as Record<string, unknown>;
        return route.fulfill({
          json: { ...session, ...patched, modifiedManually: true },
        });
      }
      return route.fulfill({ json: session });
    });

    const sessionPage = new SessionPage(page);
    await sessionPage.goto('session-course');
    await expect(sessionPage.heading).toBeVisible();

    await page.getByRole('button', { name: 'Modifier la séance', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Glucides (g)').fill('60');
    await dialog.getByLabel('Unité des glucides').selectOption({ label: 'Par heure' });
    await dialog.getByLabel('Hydratation (ml)').fill('750');
    await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();

    await expect.poll(() => patched).toBeDefined();
    expect(patched).toMatchObject({
      carbsGrams: 60,
      carbsUnit: 'par_heure',
      hydrationMilliliters: 750,
    });
  });
});
