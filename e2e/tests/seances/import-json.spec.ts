import { expect, test, type Page } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';
import { SessionPage } from '../../pages/session.page';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const POST_SESSIONS_URL = /\/api\/sessions$/;
const IMPORT_URL = /\/api\/sessions\/import$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const PAUSES_URL = /\/api\/pauses(\?.*)?$/;
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

function planFile(seances: unknown[]): string {
  return JSON.stringify({ kind: 'plan-seances', schemaVersion: 1, importId: IMPORT_ID, seances });
}

const SINGLE_SESSION = planFile([
  {
    date: '2026-11-25',
    disciplineTypeKey: 'running',
    durationMinutes: 50,
    description: 'Seuil',
    modules: [MODULE],
  },
]);

async function mockCalendar(page: Page): Promise<void> {
  await page.route(SLOTS_URL, (route) => route.fulfill({ json: { from: '', to: '', items: [] } }));
  await page.route(PAUSES_URL, (route) => route.fulfill({ json: { items: [] } }));
  await page.route(DISCIPLINES_URL, (route) =>
    route.fulfill({ json: { items: [{ typeKey: 'running', label: 'Course à pied' }] } }),
  );
  await page.route(SESSIONS_URL, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: { items: [] } });
    }
    return route.continue();
  });
}

test.describe('Séances préparées en JSON', () => {
  test('pré-remplit la création depuis un fichier, puis crée la séance avec ses modules', async ({
    page,
  }) => {
    await mockCalendar(page);
    await page.route(POST_SESSIONS_URL, (route) =>
      route.fulfill({ status: 201, json: { id: 'session-json' } }),
    );

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Nouvelle séance', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Ou collez le contenu JSON').fill(SINGLE_SESSION);

    await expect(dialog.getByLabel('Discipline')).toHaveValue('running');
    await expect(dialog.getByLabel('Durée (min)')).toHaveValue('50');
    await expect(dialog.getByText('Modules (1) · 40 min')).toBeVisible();

    for (const [label, value] of [
      ['Z1 (%)', '10'],
      ['Z2 (%)', '20'],
      ['Z3 (%)', '40'],
      ['Z4 (%)', '20'],
      ['Z5 (%)', '10'],
    ] as const) {
      await dialog.getByLabel(label).fill(value);
    }
    const createRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && POST_SESSIONS_URL.test(request.url()),
    );
    await dialog.getByRole('button', { name: 'Créer la séance', exact: true }).click();

    const body = (await createRequest).postDataJSON() as Record<string, unknown>;
    expect(body).toMatchObject({
      date: '2026-11-25',
      disciplineTypeKey: 'running',
      durationMinutes: 50,
      description: 'Seuil',
      modules: [MODULE],
    });
    await expect(page).toHaveURL(/\/seances\/session-json$/);
  });

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
