import { expect, test, type Locator, type Page } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';
import { SessionPage } from '../../pages/session.page';

const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const POST_SESSIONS_URL = /\/api\/sessions$/;
const IMPORT_URL = /\/api\/sessions\/import$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const PAUSES_URL = /\/api\/pauses(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;
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

/** Dépose un fichier `plan-seances` dans la zone de la boîte de dialogue ouverte. */
async function dropPlan(dialog: Locator, content: string): Promise<void> {
  const zone = dialog.getByRole('group', { name: /Fichier de séances? \(\.json\)/ });
  const dataTransfer = await zone.evaluateHandle((_, text) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([text], 'plan.json', { type: 'application/json' }));
    return transfer;
  }, content);
  await zone.dispatchEvent('drop', { dataTransfer });
}

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
    await dropPlan(dialog, SINGLE_SESSION);

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
    // La fiche de la séance créée s'ouvre en modale, sans changer de page.
    await expect(page).toHaveURL(/\/creneaux$/);
  });

  test('importe plusieurs séances d’un coup puis affiche le nombre créé', async ({ page }) => {
    await mockCalendar(page);
    const imports: unknown[] = [];
    await page.route(IMPORT_URL, (route) => {
      imports.push(route.request().postDataJSON());
      return route.fulfill({
        status: 201,
        json: { importId: IMPORT_ID, createdCount: 2, sessionIds: ['a', 'b'] },
      });
    });

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Importer des séances', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dropPlan(
      dialog,
      planFile([
        {
          date: '2026-11-25',
          disciplineTypeKey: 'running',
          durationMinutes: 50,
          modules: [MODULE],
        },
        {
          date: '2026-11-27',
          disciplineTypeKey: 'running',
          durationMinutes: 30,
          modules: [MODULE],
        },
      ]),
    );
    await expect(dialog.getByText('2 séance(s) détectée(s) dans le fichier.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Importer les séances', exact: true }).click();

    await expect(page.getByText('2 séance(s) importée(s).')).toBeVisible();
    await expect(dialog).toBeHidden();
    expect(imports).toHaveLength(1);
    expect(imports[0]).toMatchObject({ kind: 'plan-seances', importId: IMPORT_ID });
  });

  test('affiche chaque erreur d’import avec son chemin et ne crée aucune séance', async ({
    page,
  }) => {
    await mockCalendar(page);
    await page.route(IMPORT_URL, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'urn:sport-hub:problem:session-import-invalid',
          title: 'Bad Request',
          status: 400,
          detail: 'Fichier invalide.',
          instance: '/api/sessions/import',
          code: 'SESSION_IMPORT_INVALID',
          correlationId: '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
          errors: [
            {
              field: 'seances[1].modules[0].durationMinutes',
              code: 'SESSION_IMPORT_FIELD_TYPE',
              message: 'doit être un nombre entier',
            },
          ],
        }),
      }),
    );

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Importer des séances', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dropPlan(dialog, SINGLE_SESSION);
    await dialog.getByRole('button', { name: 'Importer les séances', exact: true }).click();

    await expect(dialog.getByRole('alert')).toContainText('aucune séance n’a été créée');
    await expect(dialog.getByText('seances[1].modules[0].durationMinutes')).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('signale un fichier déjà importé sans créer de séance', async ({ page }) => {
    await mockCalendar(page);
    await page.route(IMPORT_URL, (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'urn:sport-hub:problem:session-import-already-done',
          title: 'Conflict',
          status: 409,
          detail: 'Déjà importé.',
          instance: '/api/sessions/import',
          code: 'SESSION_IMPORT_ALREADY_DONE',
          correlationId: '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
        }),
      }),
    );

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Importer des séances', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dropPlan(dialog, SINGLE_SESSION);
    await dialog.getByRole('button', { name: 'Importer les séances', exact: true }).click();

    await expect(dialog.getByRole('alert')).toContainText('Ce fichier a déjà été importé');
    await expect(dialog).toBeVisible();
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
    const dialog = page.getByRole('dialog').last();
    await dropPlan(dialog, SINGLE_SESSION);
    await expect(dialog.getByLabel('Durée (min)')).toHaveValue('50');
    expect(patched).toBeUndefined();

    await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();

    // Seule la fiche reste ouverte, sous la modale d’édition fermée.
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await expect(page.getByText('50 min', { exact: true })).toBeVisible();
    expect(patched).toMatchObject({
      date: '2026-11-25',
      disciplineTypeKey: 'running',
      durationMinutes: 50,
      description: 'Seuil',
    });
  });
});
