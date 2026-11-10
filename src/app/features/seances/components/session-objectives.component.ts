import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HR_ZONES, displayedRate, formatZoneGap } from '@shared/utils/session-objectives';
import type { SessionAchievement, SessionObjectives } from '../models/session.model';

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/**
 * Section « Objectifs » de la fiche : distance cible, répartition cible par zone, et, une fois une activité liée,
 * les taux de réalisation (plafonnés à 100 %) et les écarts signés par zone, avec la couleur de la zone.
 * Présentationnel : aucune donnée n'est recalculée hors des utilitaires partagés.
 */
@Component({
  selector: 'sh-session-objectives',
  templateUrl: './session-objectives.component.html',
  styleUrl: './session-objectives.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionObjectivesComponent {
  readonly objectives = input.required<SessionObjectives>();
  readonly achievement = input<SessionAchievement | null>(null);

  protected readonly zones = HR_ZONES;

  protected readonly distanceLabel = computed(() => {
    const meters = this.objectives().distanceMeters;
    return meters === null ? '—' : `${NUMBER_FORMAT.format(meters / 1000)} km`;
  });

  protected readonly distanceRate = computed(() =>
    displayedRate(this.achievement()?.distanceRate ?? null),
  );
  protected readonly durationRate = computed(() =>
    displayedRate(this.achievement()?.durationRate ?? null),
  );

  protected readonly zoneGaps = computed(() => {
    const gaps = this.achievement()?.zoneGapsPoints;
    if (!gaps) {
      return null;
    }
    return HR_ZONES.map((zone, index) => ({
      label: zone.label,
      colorVariable: zone.colorVariable,
      text: formatZoneGap(gaps[index] ?? 0),
    }));
  });

  protected formatRate(rate: number | null): string {
    return rate === null ? '—' : `${NUMBER_FORMAT.format(rate)} %`;
  }
}
