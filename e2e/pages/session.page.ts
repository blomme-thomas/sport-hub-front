import type { Locator, Page } from '@playwright/test';
import { currentWeekDay } from '../support/week-dates';

export class SessionPage {
  readonly heading: Locator;
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Course à pied', level: 1 });
    this.saveButton = page.getByRole('button', {
      name: 'Enregistrer les modifications',
      exact: true,
    });
  }

  /**
   * Ouvre la fiche de la séance comme le fait l'utilisateur : depuis le calendrier, en cliquant sur la séance
   * de la semaine courante. La fiche s'affiche en modale, sans changer de page.
   */
  async goto(id: string): Promise<void> {
    await this.page.route(/\/api\/slots(\?.*)?$/, (route) =>
      route.fulfill({ json: { from: '', to: '', items: [] } }),
    );
    await this.page.route(/\/api\/pauses(\?.*)?$/, (route) =>
      route.fulfill({ json: { items: [] } }),
    );
    await this.page.route(/\/api\/sessions\?/, (route) =>
      route.fulfill({
        json: {
          items: [
            {
              sessionId: id,
              date: currentWeekDay(2),
              startTime: '18:00',
              durationMinutes: 45,
              disciplineTypeKey: 'course_a_pied',
              recurrence: 'aucune',
              status: 'planifiee',
            },
          ],
        },
      }),
    );
    await this.page.goto('/creneaux');
    await this.page.getByRole('button', { name: /^Séance .*Ouvrir la séance$/ }).click();
  }

  /** Champ de durée du module à la position donnée (1 à n). */
  durationOf(position: number): Locator {
    return this.page
      .getByRole('list', { name: 'Modules de la séance' })
      .getByRole('listitem')
      .nth(position - 1)
      .getByLabel('Durée (min)');
  }

  modifiedBadge(): Locator {
    return this.page.getByText('Modifiée', { exact: true });
  }

  readOnlyNotice(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'lecture seule' });
  }
}
