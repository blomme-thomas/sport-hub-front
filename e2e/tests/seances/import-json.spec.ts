import { expect, test } from '@playwright/test';
import { SessionPage } from '../../pages/session.page';

const DISCIPLINES_URL = /\/api\/disciplines$/;
const SESSION_URL = /\/api\/sessions\/session-course$/;
const IMPORT_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const MODULE = {
  type: 'series',
  durationMinutes: 40,
  instruction: '4 x 1000 m',
  targetZones: null,
  perceivedEffort: 8,
};

const SINGLE_SESSION = JSON.stringify({
  kind: 'plan-seances',
  schemaVersion: 1,
  importId: IMPORT_ID,
  seances: [
    {
      date: '2026-11-25',
      disciplineTypeKey: 'running',
      durationMinutes: 50,
      description: 'Seuil',
      modules: [MODULE],
    },
  ],
});

test.describe('Séances préparées en JSON', () => {
  test('modifie une séance depuis un fichier JSON puis enregistre ses champs', async ({ page }) => {
    const session = {
      id: 'session-course',
      date: '2026-11-12',
      disciplineTypeKey: 'running',
      durationMinutes: 45,
      startTime: '18:00',
      status: 'planifiee',
      modifiedManually: false,
      description: null,
      title: null,
      modules: [],
      changeLog: [],
      targetDistanceMeters: null,
      targetHrZonePercentages: null,
      achievement: null,
      activity: null,
    };
    let patched: Record<string, unknown> | undefined;
    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'running', label: 'Course à pied' }] } }),
    );
    await page.route(SESSION_URL, (route) => {
      if (route.request().method() === 'PATCH') {
        patched = route.request().postDataJSON() as Record<string, unknown>;
        return route.fulfill({
          json: { ...session, ...patched, durationMinutes: 50, modifiedManually: true },
        });
      }
      return route.fulfill({ json: session });
    });
    await page.route(/\/api\/sessions\/session-course\/modules$/, (route) =>
      route.fulfill({
        json: { ...session, durationMinutes: 50, modules: [{ position: 1, ...MODULE }] },
      }),
    );
    await page.route(/\/api\/activities(\?.*)?$/, (route) =>
      route.fulfill({ json: { items: [], page: 1, pageSize: 100, total: 0 } }),
    );

    const fiche = new SessionPage(page);
    await fiche.goto('session-course');
    await expect(fiche.heading).toBeVisible();
    await page.getByRole('button', { name: 'Modifier la séance', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Ou collez le contenu JSON').fill(SINGLE_SESSION);
    await expect(dialog.getByLabel('Durée (min)')).toHaveValue('50');
    expect(patched).toBeUndefined();

    await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText('50 min', { exact: true })).toBeVisible();
    expect(patched).toMatchObject({
      date: '2026-11-25',
      disciplineTypeKey: 'running',
      durationMinutes: 50,
      description: 'Seuil',
    });
  });
});
