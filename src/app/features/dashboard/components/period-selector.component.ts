import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import type { DashboardPeriod } from '../models/training-stats.model';

interface PeriodOption {
  value: DashboardPeriod;
  label: string;
  /** Libellé lu par les lecteurs d'écran (le libellé court seul est ambigu). */
  spokenLabel: string;
}

const OPTIONS: readonly PeriodOption[] = [
  { value: '7d', label: '7 j', spokenLabel: '7 derniers jours' },
  { value: '30d', label: '30 j', spokenLabel: '30 derniers jours' },
  { value: '3m', label: '3 mois', spokenLabel: '3 derniers mois' },
  { value: '1y', label: '1 an', spokenLabel: '1 dernière année' },
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
  readonly value = input.required<DashboardPeriod>();
  readonly changed = output<DashboardPeriod>();

  protected readonly options = OPTIONS;
}
