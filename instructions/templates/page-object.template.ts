// Squelette — à copier dans e2e/pages/<name>.page.ts puis adapter.
// Exclu du build/lint/test unitaire (voir instructions/11, section "Templates de code").
// Référence : instructions/09b-e2e-testing.instructions.md
//
// Page object : encapsule locators (par rôle/label) et actions ; pas d'assertions métier lourdes ici.

import type { Locator, Page } from '@playwright/test';

export class ActivitiesPage {
  readonly heading: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Activités' });
    this.rows = page.getByRole('article');
  }

  async goto(): Promise<void> {
    await this.page.goto('/activities');
  }

  async open(label: string): Promise<void> {
    await this.rows.filter({ hasText: label }).getByRole('button', { name: 'Ouvrir' }).click();
  }
}
