import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly heading: Locator;
  readonly brandLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Sport Hub' });
    this.brandLink = page.getByRole('link', { name: 'Sport Hub' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
