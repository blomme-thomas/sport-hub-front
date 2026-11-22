import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEXTS } from '@shared/texts/texts';

@Component({
  selector: 'sh-not-found-page',
  imports: [RouterLink],
  template: `
    <h1>{{ t.shell.notFound.title }}</h1>
    <p>
      <a routerLink="/">{{ t.shell.notFound.home }}</a>
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  protected readonly t = TEXTS;
}
