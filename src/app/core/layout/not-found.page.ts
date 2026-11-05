import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sh-not-found-page',
  imports: [RouterLink],
  template: `
    <h1>Page introuvable</h1>
    <p><a routerLink="/">Retour à l'accueil</a></p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
