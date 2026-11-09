import type { Locator, Page } from '@playwright/test';

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

  async goto(id: string): Promise<void> {
    await this.page.goto(`/seances/${id}`);
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
