import { expect, test } from '@playwright/test';
import { SessionPage } from '../../pages/session.page';

const SESSION_URL = /\/api\/sessions\/session-course$/;
const MODULES_URL = /\/api\/sessions\/session-course\/modules$/;
const DISCIPLINES_URL = /\/api\/disciplines$/;

const session = {
  id: 'session-course',
  date: '2026-11-12',
  disciplineTypeKey: 'course_a_pied',
  durationMinutes: 45,
  startTime: '18:00',
  status: 'planifiee',
  modifiedManually: false,
  description: null,
  equipment: 'Montre GPS',
  attentionPoints: 'Hydratation',
  modules: [
    {
      position: 1,
      type: 'echauffement',
      durationMinutes: 10,
      instruction: 'Footing souple',
      targetZones: null,
      perceivedEffort: null,
    },
    {
      position: 2,
      type: 'series',
      durationMinutes: 25,
      instruction: '4 x 400 m',
      targetZones: { heartRate: { min: 160, max: 170 } },
      perceivedEffort: 7,
    },
    {
      position: 3,
      type: 'retour_au_calme',
      durationMinutes: 10,
      instruction: 'Footing lent',
      targetZones: null,
      perceivedEffort: null,
    },
  ],
  changeLog: [],
};

test.describe('Fiche de séance', () => {
  test('modifie la durée d’un module et enregistre la séance', async ({ page }) => {
    let saved: Record<string, unknown> | undefined;
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'course_a_pied', label: 'Course à pied' }] } }),
    );
    await page.route(SESSION_URL, (route) => route.fulfill({ json: session }));
    await page.route(MODULES_URL, (route) => {
      saved = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        json: {
          ...session,
          modifiedManually: true,
          modules: session.modules.map((module, index) =>
            index === 1 ? { ...module, durationMinutes: 30 } : module,
          ),
        },
      });
    });

    const sessionPage = new SessionPage(page);
    await sessionPage.goto('session-course');
    await expect(sessionPage.heading).toBeVisible();

    await sessionPage.durationOf(2).fill('30');
    await expect(sessionPage.saveButton).toBeEnabled();
    await sessionPage.saveButton.click();

    await expect(sessionPage.modifiedBadge()).toBeVisible();
    expect(saved).toMatchObject({
      modules: expect.arrayContaining([
        expect.objectContaining({ type: 'series', durationMinutes: 30 }),
      ]),
    });
  });

  test('affiche une séance réalisée en lecture seule', async ({ page }) => {
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'course_a_pied', label: 'Course à pied' }] } }),
    );
    await page.route(SESSION_URL, (route) =>
      route.fulfill({ json: { ...session, status: 'realisee' } }),
    );

    const sessionPage = new SessionPage(page);
    await sessionPage.goto('session-course');

    await expect(sessionPage.readOnlyNotice()).toBeVisible();
    await expect(sessionPage.saveButton).toHaveCount(0);
  });
});
