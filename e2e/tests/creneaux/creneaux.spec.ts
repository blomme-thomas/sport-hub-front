import { expect, test } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';

const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const POST_SLOTS_URL = /\/api\/slots$/;

test.describe('Calendrier', () => {
  test('crée un créneau libre ponctuel sur la semaine affichée', async ({ page }) => {
    const slots: Record<string, unknown>[] = [];
    await page.route(SLOTS_URL, (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const created = { id: 'slot-libre-mardi', ...request.postDataJSON() };
        slots.push({
          slotId: created.id,
          type: created.type,
          date: created.date,
          startTime: created.startTime,
          endTime: created.endTime,
          recurrence: created.recurrence,
          timeZone: created.timeZone,
        });
        return route.fulfill({ status: 201, json: created });
      }
      return route.fulfill({ json: { from: '', to: '', items: slots } });
    });

    await page.route(/\/api\/sessions(\?.*)?$/, (route) => route.fulfill({ json: { items: [] } }));
    await page.route(/\/api\/disciplines$/, (route) => route.fulfill({ json: { items: [] } }));

    const creneaux = new CreneauxPage(page);
    await creneaux.goto();
    await expect(creneaux.heading).toBeVisible();

    await creneaux.openNewSlot();
    await creneaux.chooseType('Libre');
    await creneaux.fillTimes('09:00', '10:30');

    const createRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && POST_SLOTS_URL.test(request.url()),
    );
    await creneaux.submit();

    const body = (await createRequest).postDataJSON() as Record<string, unknown>;
    expect(body).toMatchObject({
      type: 'libre',
      startTime: '09:00',
      endTime: '10:30',
      recurrence: 'aucune',
    });
    expect(body['date']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await expect(creneaux.dialog).toBeHidden();
    await expect(creneaux.slotBlock('Libre, 09:00 – 10:30')).toBeVisible();
  });
});
