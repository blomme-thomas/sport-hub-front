import type { Locator, Page } from '@playwright/test';

export class NutritionPage {
  readonly heading: Locator;
  readonly recipesTab: Locator;
  readonly foodsTab: Locator;
  readonly tabPanel: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Nutrition', level: 1 });
    this.recipesTab = page.getByRole('tab', { name: 'Mes recettes', exact: true });
    this.foodsTab = page.getByRole('tab', { name: 'Mes aliments', exact: true });
    this.tabPanel = page.getByRole('tabpanel');
  }

  async goto(): Promise<void> {
    await this.page.goto('/nutrition');
  }
}
