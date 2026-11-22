import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TitleStrategy } from '@angular/router';

/** Nom de l'application, affiché seul dans l'onglet du navigateur. */
export const APP_NAME = 'Sport Hub';

/** Titre du document toujours fixé à « Sport Hub », quelle que soit la page. */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(): void {
    this.title.setTitle(APP_NAME);
  }
}
