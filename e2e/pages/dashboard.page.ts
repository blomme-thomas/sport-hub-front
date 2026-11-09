import type { Locator, Page } from '@playwright/test';

const BYTYPE_TITLE = 'Répartition par type (dernière période)';

export class DashboardPage {
  readonly heading: Locator;
  /** Bouton du sélecteur de période correspondant au mois (3 mois). */
  readonly monthToggle: Locator;
  readonly byTypeCard: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Tableau de bord', level: 1 });
    this.monthToggle = page.getByRole('button', { name: '3 derniers mois' });
    this.byTypeCard = this.card(BYTYPE_TITLE);
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async selectMonth(): Promise<void> {
    await this.page.getByRole('button', { name: '3 derniers mois' }).click();
  }

  figure(label: string): Locator {
    return this.page
      .getByRole('article')
      .filter({ has: this.page.getByRole('heading', { name: label, exact: true }) });
  }

  card(title: string): Locator {
    return this.page
      .getByRole('article')
      .filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }

  byTypeRow(type: string): Locator {
    return this.byTypeCard.getByRole('row').filter({ hasText: type });
  }

  expandButton(title: string): Locator {
    return this.page.getByRole('button', {
      name: `Agrandir le graphique : ${title}`,
      exact: true,
    });
  }

  dialog(title: string): Locator {
    return this.page.getByRole('dialog', { name: title, exact: true });
  }

  async openChart(title: string): Promise<void> {
    await this.expandButton(title).click();
  }

  async closeWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async closeWithButton(title: string): Promise<void> {
    await this.dialog(title).getByRole('button', { name: 'Fermer', exact: true }).click();
  }
}
