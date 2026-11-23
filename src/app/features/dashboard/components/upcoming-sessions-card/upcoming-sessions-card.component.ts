import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { TEXTS } from '@shared/texts/texts';
import type { AppError } from '../../../../core/http/app-error';
import type { UpcomingSessionView } from '../../data-access/upcoming-sessions.state';

/**
 * Carte « Séances programmées » : les prochaines séances planifiées, dans le même esprit que « Détails par activités ».
 * Un clic émet l'identifiant de la séance, pour ouvrir sa fiche.
 */
@Component({
  selector: 'sh-upcoming-sessions-card',
  imports: [NzButtonComponent, IconComponent],
  templateUrl: './upcoming-sessions-card.component.html',
  styleUrl: './upcoming-sessions-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpcomingSessionsCardComponent {
  protected readonly t = TEXTS;
  /** `undefined` tant que la liste n'est pas chargée, tableau vide s'il n'y a aucune séance à venir. */
  readonly sessions = input.required<UpcomingSessionView[] | undefined>();
  readonly error = input<AppError | null>(null);
  readonly loading = input<boolean>(false);
  readonly retry = output<void>();
  /** Une séance a été cliquée : son identifiant, pour ouvrir la fiche. */
  readonly opened = output<string>();
}
