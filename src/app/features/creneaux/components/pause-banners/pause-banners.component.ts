import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { PAUSE_REASON_LABELS, type Pause } from '../../models/pause.model';
import { fill, TEXTS } from '@shared/texts/texts';

/**
 * Bandeaux des pauses de la semaine affichée, au-dessus de la grille. Modifier ou supprimer une pause se fait
 * depuis son bandeau. Présentationnel : émet l'intention, ne fait aucun appel.
 */
@Component({
  selector: 'sh-pause-banners',
  imports: [NzButtonComponent],
  templateUrl: './pause-banners.component.html',
  styleUrl: './pause-banners.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PauseBannersComponent {
  protected readonly t = TEXTS;
  protected readonly fill = fill;
  readonly pauses = input.required<readonly Pause[]>();

  readonly edited = output<Pause>();
  readonly removed = output<Pause>();

  protected readonly reasonLabels = PAUSE_REASON_LABELS;

  protected rangeLabel(pause: Pause): string {
    return fill(TEXTS.creneaux.pause.range, {
      start: formatDay(pause.startDate),
      end: formatDay(pause.endDate),
    });
  }
}

function formatDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}
