import { expect, test } from '@playwright/test';
import { SessionPage } from '../../pages/session.page';

const SESSION_URL = /\/api\/sessions\/session-course$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;
const ACTIVITIES_LIST_URL = /\/api\/activities(\?.*)?$/;
const ACTIVITY_DETAIL_URL = /\/api\/activities\/activity-1$/;
const COMMENT_URL = /\/api\/activities\/activity-1\/comment$/;

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

const activityDetail = {
  id: 'activity-1',
  type: 'running',
  startedAt: '2026-11-12T18:00:00.000Z',
  durationSeconds: 2700,
  distanceMeters: 8000,
  averageHeartRate: 150,
};

test.describe('Commentaire de l’activité réalisée', () => {
  test('ajoute un commentaire en markdown puis l’affiche rendu', async ({ page }) => {
    let saved: { text: string } | undefined;
    let stored: Record<string, unknown> | null = null;

    await page.route(DISCIPLINES_URL, (route) =>
      route.fulfill({ json: { items: [{ typeKey: 'course_a_pied', label: 'Course à pied' }] } }),
    );
    await page.route(SESSION_URL, (route) => route.fulfill({ json: session }));
    await page.route(ACTIVITIES_LIST_URL, (route) =>
      route.fulfill({ json: { items: [], page: 1, pageSize: 100, total: 0 } }),
    );
    await page.route(ACTIVITY_DETAIL_URL, (route) => route.fulfill({ json: activityDetail }));
    await page.route(COMMENT_URL, (route) => {
      if (route.request().method() === 'PUT') {
        saved = route.request().postDataJSON() as { text: string };
        stored = {
          activityId: 'activity-1',
          text: saved.text,
          source: 'saisie-manuelle',
          model: null,
          generatedAt: '2026-11-17T19:00:00.000Z',
        };
        return route.fulfill({ json: stored });
      }
      return stored === null
        ? route.fulfill({
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
          })
        : route.fulfill({ json: stored });
    });

    const sessionPage = new SessionPage(page);
    await sessionPage.goto('session-course');

    await expect(page.getByText('Aucun commentaire pour cette activité.')).toBeVisible();
    await page.getByRole('button', { name: 'Ajouter un commentaire' }).click();

    await page.getByLabel('Texte (markdown)').fill('## Bilan\n\nBonne **allure**, régulière.');
    await expect(page.getByLabel('Aperçu')).toContainText('Bilan');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Bilan', level: 2 })).toBeVisible();
    await expect(page.locator('.comment__rendered strong')).toHaveText('allure');
    await expect(page.getByText('Saisi à la main')).toBeVisible();
    expect(saved?.text).toBe('## Bilan\n\nBonne **allure**, régulière.');
  });
});
