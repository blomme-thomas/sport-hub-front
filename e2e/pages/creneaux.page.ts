import type { Locator, Page } from '@playwright/test';

export class CreneauxPage {
  readonly heading: Locator;
  readonly newSlotButton: Locator;
  readonly dialog: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Calendrier', level: 1 });
    this.newSlotButton = page.getByRole('button', { name: 'Nouveau créneau', exact: true });
    this.dialog = page.getByRole('dialog');
  }

  async goto(): Promise<void> {
    await this.page.goto('/creneaux');
  }

  async openNewSlot(): Promise<void> {
    await this.newSlotButton.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  async chooseType(label: string): Promise<void> {
    await this.dialog
      .locator('nz-select')
      .filter({ has: this.page.getByRole('combobox', { name: 'Type', exact: true }) })
      .click();
    await this.page.locator('.ant-select-item-option').getByText(label, { exact: true }).click();
  }

  async fillTimes(start: string, end: string): Promise<void> {
    await this.dialog.getByLabel('Début', { exact: true }).fill(start);
    await this.dialog.getByLabel('Fin', { exact: true }).fill(end);
  }

  async submit(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  }

  /** Bloc de créneau de la grille, identifié par son libellé accessible (type et heures). */
  slotBlock(label: string): Locator {
    return this.page.getByRole('button', { name: label, exact: false });
  }
}
