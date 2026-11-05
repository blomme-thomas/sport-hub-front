import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Page d'accueil minimale, en attendant les premières features. */
@Component({
  selector: 'sh-home-page',
  template: `
    <h1>Sport Hub</h1>
    <p>Dashboard des données Garmin et des entraînements planifiés.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
