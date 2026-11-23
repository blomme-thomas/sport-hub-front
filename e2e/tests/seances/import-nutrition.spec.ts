import { expect, test, type Locator, type Page } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const IMPORT_URL = /\/api\/sessions\/import$/;
const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const PAUSES_URL = /\/api\/pauses(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;
const IMPORT_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3302';

const MODULE = {
  type: 'series',
  durationMinutes: 40,
  instruction: '4 x 1000 m',
  targetZones: null,
  perceivedEffort: 8,
};

/** Fichier `plan-seances` version 2 : glucides et hydratation par séance. */
const PLAN_V2 = JSON.stringify({
  kind: 'plan-seances',
  schemaVersion: 2,
  importId: IMPORT_ID,
  seances: [
    {
      date: '2026-11-25',
      disciplineTypeKey: 'running',
      durationMinutes: 90,
      modules: [MODULE],
      carbsGrams: 60,
      carbsUnit: 'par_heure',
      hydrationMilliliters: 750,
    },
    {
      date: '2026-11-27',
      disciplineTypeKey: 'running',
      durationMinutes: 30,
      modules: [MODULE],
      hydrationMilliliters: 400,
    },
  ],
});

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
  await page.route(SESSIONS_URL, (route) => route.fulfill({ json: { items: [] } }));
}

test.describe('Import JSON : glucides et hydratation', () => {
  test('importe un fichier version 2 en lot avec ses champs de nutrition', async ({ page }) => {
    await mockCalendar(page);
    const imports: Record<string, unknown>[] = [];
    await page.route(IMPORT_URL, (route) => {
      imports.push(route.request().postDataJSON() as Record<string, unknown>);
      return route.fulfill({
        status: 201,
        json: { importId: IMPORT_ID, createdCount: 2, sessionIds: ['a', 'b'] },
      });
    });

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Importer des séances', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dropPlan(dialog, PLAN_V2);
    await expect(dialog.getByText('2 séance(s) détectée(s) dans le fichier.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Importer les séances', exact: true }).click();

    await expect(page.getByText('2 séance(s) importée(s).')).toBeVisible();
    expect(imports).toHaveLength(1);
    expect(imports[0]).toMatchObject({ schemaVersion: 2, importId: IMPORT_ID });
    const [first, second] = (imports[0]?.['seances'] ?? []) as Record<string, unknown>[];
    expect(first).toMatchObject({
      carbsGrams: 60,
      carbsUnit: 'par_heure',
      hydrationMilliliters: 750,
    });
    expect(second).toMatchObject({ hydrationMilliliters: 400 });
  });
});
