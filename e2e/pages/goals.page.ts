import type { Locator, Page } from '@playwright/test';

export interface TargetTimeInput {
  hours: number;
  minutes: number;
  seconds: number;
}

export class GoalsPage {
  readonly heading: Locator;
  readonly newGoalButton: Locator;
  readonly dialog: Locator;
  readonly upcomingSection: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Objectifs', level: 1 });
    this.newGoalButton = page.getByRole('button', { name: 'Nouvel objectif', exact: true });
    this.dialog = page.getByRole('dialog');
    this.upcomingSection = page.getByRole('region', { name: 'À venir', exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/goals');
  }

  async openNewGoal(): Promise<void> {
    await this.newGoalButton.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  async fillTitle(title: string): Promise<void> {
    await this.dialog.getByLabel('Titre', { exact: true }).fill(title);
  }

  async chooseType(label: string): Promise<void> {
    await this.select('Type').click();
    await this.option(label).click();
  }

  async chooseFormat(label: string): Promise<void> {
    await this.select('Format').click();
    await this.option(label).click();
  }

  private select(name: string): Locator {
    return this.dialog
      .locator('nz-select')
      .filter({ has: this.page.getByRole('combobox', { name, exact: true }) });
  }

  private option(label: string): Locator {
    return this.page.locator('.ant-select-item-option').getByText(label, { exact: true });
  }

  async fillDate(isoDate: string): Promise<void> {
    const input = this.dialog.getByLabel('Date', { exact: true });
    const panel = this.page.locator('.ant-picker-dropdown');
    await input.click();
    await panel.waitFor({ state: 'visible' });
    await input.fill(isoDate);
    await panel
      .locator('.ant-picker-cell-in-view')
      .getByText(String(Number(isoDate.slice(8, 10))), { exact: true })
      .click();
  }

  async fillTargetTime({ hours, minutes, seconds }: TargetTimeInput): Promise<void> {
    await this.dialog.getByLabel('Heures', { exact: true }).fill(String(hours));
    await this.dialog.getByLabel('Minutes', { exact: true }).fill(String(minutes));
    await this.dialog.getByLabel('Secondes', { exact: true }).fill(String(seconds));
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  }

  upcomingItem(title: string): Locator {
    return this.upcomingSection.getByRole('listitem').filter({ hasText: title });
  }
}
