import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import type { DashboardPeriod } from '../../models/training-stats.model';
import { TEXTS } from '@shared/texts/texts';

interface PeriodOption {
  value: DashboardPeriod;
  label: string;
  /** Libellé lu par les lecteurs d'écran (le libellé court seul est ambigu). */
  spokenLabel: string;
}

const OPTIONS: readonly PeriodOption[] = [
  {
    value: 'week',
    label: TEXTS.dashboard.period.week,
    spokenLabel: TEXTS.dashboard.period.spokenWeek,
  },
  {
    value: 'month',
    label: TEXTS.dashboard.period.month,
    spokenLabel: TEXTS.dashboard.period.spokenMonth,
  },
];

/**
 * Sélecteur de période du tableau de bord : quatre boutons à état appuyé (`aria-pressed`), et un bouton calendrier
 * présent mais désactivé (sélecteur de dates personnalisé hors périmètre). Présentationnel.
 */
@Component({
  selector: 'sh-period-selector',
  imports: [IconComponent],
  templateUrl: './period-selector.component.html',
  styleUrl: './period-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodSelectorComponent {
  protected readonly t = TEXTS;
  readonly value = input.required<DashboardPeriod>();
  readonly changed = output<DashboardPeriod>();

  protected readonly options = OPTIONS;
}
