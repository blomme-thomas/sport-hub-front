import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { SessionPage } from '../../pages/session.page';

const SESSION_URL = /\/api\/sessions\/session-course$/;
const DISCIPLINES_URL = /\/api\/disciplines$/;
const ACTIVITIES_LIST_URL = /\/api\/activities(\?.*)?$/;
const ACTIVITY_DETAIL_URL = /\/api\/activities\/activity-1$/;
const COMMENT_URL = /\/api\/activities\/activity-1\/comment$/;
const EXPORT_URL = /\/api\/exports\/sessions\/session-course$/;

const bilan = {
  format: 'bilan-seance',
  kind: 'bilan-seance',
  schemaVersion: 1,
  sessionId: 'session-course',
};

const session = {
  id: 'session-course',
  date: '2026-11-12',
  disciplineTypeKey: 'course_a_pied',
  durationMinutes: 45,
  startTime: '18:00',
  status: 'realisee',
  modifiedManually: false,
  description: null,
  title: null,
  modules: [],
  changeLog: [],
  activity: { id: 'activity-1', origin: 'manuel', linkedAt: '2026-11-12T18:00:00.000Z' },
};

test.describe('Export de la séance avec son activité', () => {
  test('télécharge le JSON de la séance tel que renvoyé par le back', async ({ page }) => {
    let exportCalls = 0;

    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'course_a_pied', label: 'Course à pied' }] } }),
    );
    await page.route(SESSION_URL, (route) => route.fulfill({ json: session }));
    await page.route(ACTIVITIES_LIST_URL, (route) =>
      route.fulfill({ json: { items: [], page: 1, pageSize: 100, total: 0 } }),
    );
    await page.route(ACTIVITY_DETAIL_URL, (route) =>
      route.fulfill({
        json: {
          id: 'activity-1',
          type: 'running',
          startedAt: '2026-11-12T18:00:00.000Z',
          durationSeconds: 2700,
          distanceMeters: 8000,
          averageHeartRate: 150,
        },
      }),
    );
    await page.route(COMMENT_URL, (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        json: {
          type: 'urn:sport-hub:problem:activity-comment-not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Aucun commentaire pour cette activité.',
          instance: '/api/activities',
          code: 'ACTIVITY_COMMENT_NOT_FOUND',
          correlationId: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
        },
      }),
    );
    await page.route(EXPORT_URL, (route) => {
      exportCalls += 1;
      return route.fulfill({ json: bilan });
    });

    const sessionPage = new SessionPage(page);
    await sessionPage.goto('session-course');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exporter la séance (JSON)' }).click();
    const file = await download;

    expect(file.suggestedFilename()).toBe('seance-2026-11-12-session-course.json');
    const path = await file.path();
    expect(path).not.toBeNull();
    const content = JSON.parse(await readFile(path as string, 'utf8')) as typeof bilan;
    expect(content).toEqual(bilan);
    expect(exportCalls).toBe(1);
  });
});
