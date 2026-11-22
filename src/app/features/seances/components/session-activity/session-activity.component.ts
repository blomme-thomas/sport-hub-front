import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../../core/http/app-error';
import type { SessionActivityApi } from '../../models/session-activity.api-model';
import type { LinkedActivity } from '../../models/session.model';
import { TEXTS, fill } from '@shared/texts/texts';

const ORIGIN_LABELS: Record<LinkedActivity['origin'], string> = {
  automatique: TEXTS.seances.activity.automatic,
  manuel: TEXTS.seances.activity.manual,
};

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/**
 * Section « Activité réalisée » de la fiche : l'activité liée (distance, durée, FC, origine du lien) avec « Dissocier »,
 * ou la liste des activités du même jour et de la même discipline, à associer une à une.
 * Présentationnel : les appels passent par le state, qui reçoit les événements `link` et `unlink`.
 */
@Component({
  selector: 'sh-session-activity',
  imports: [DatePipe, NzButtonComponent],
  templateUrl: './session-activity.component.html',
  styleUrl: './session-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionActivityComponent {
  protected readonly t = TEXTS;
  readonly linked = input<LinkedActivity | null>(null);
  readonly linkedDetail = input<SessionActivityApi | null>(null);
  readonly candidates = input<readonly SessionActivityApi[]>([]);
  readonly busy = input(false);
  readonly error = input<AppError | null>(null);
  readonly exporting = input(false);

  readonly link = output<string>();
  readonly unlink = output<void>();
  readonly exportSession = output<void>();

  protected readonly originLabel = computed(() => {
    const origin = this.linked()?.origin;
    return origin ? ORIGIN_LABELS[origin] : '';
  });

  protected formatKm(meters: number | null): string {
    return meters === null ? '—' : `${NUMBER_FORMAT.format(meters / 1000)} km`;
  }

  protected formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours === 0
      ? fill(TEXTS.seances.activity.minutes, { value: minutes })
      : fill(TEXTS.seances.activity.hoursMinutes, {
          hours,
          minutes: String(minutes).padStart(2, '0'),
        });
  }
}
