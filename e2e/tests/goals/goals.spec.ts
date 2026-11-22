import { expect, test } from '@playwright/test';
import { GoalsPage } from '../../pages/goals.page';

const GOALS_URL = /\/api\/goals(\?.*)?$/;
const POST_GOALS_URL = /\/api\/goals$/;
const TRIATHLON_TITLE = 'Triathlon de Paris';
const TRIATHLON_DATE = '2030-06-15';

test.describe('Objectifs', () => {
  test('crée un événement triathlon avec format, date et temps cible', async ({ page }) => {
    const goals: Record<string, unknown>[] = [];
    await page.route(GOALS_URL, (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const created = { id: 'goal-triathlon-paris', ...request.postDataJSON() };
        goals.push(created);
        return route.fulfill({ status: 201, json: created });
      }
      return route.fulfill({ json: { items: goals } });
    });

    const goalsPage = new GoalsPage(page);
    await goalsPage.goto();
    await expect(goalsPage.heading).toBeVisible();

    await goalsPage.openNewGoal();
    await goalsPage.fillTitle(TRIATHLON_TITLE);
    await goalsPage.chooseType('Événement');
    await goalsPage.fillDate(TRIATHLON_DATE);
    await goalsPage.chooseFormat('Olympique');
    await goalsPage.fillTargetTime({ hours: 2, minutes: 30, seconds: 0 });

    const createRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && POST_GOALS_URL.test(request.url()),
    );
    await goalsPage.submit();

    expect((await createRequest).postDataJSON()).toEqual({
      title: TRIATHLON_TITLE,
      type: 'evenement',
      targetDate: TRIATHLON_DATE,
      eventFormat: 'olympique',
      targetTimeSeconds: 9000,
    });
    await expect(goalsPage.dialog).toBeHidden();
    await expect(goalsPage.upcomingItem(TRIATHLON_TITLE)).toBeVisible();
  });
});
