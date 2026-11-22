import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { ZonesCardView } from '../../models/zones-card.model';
import { TEXTS } from '@shared/texts/texts';

/** Ligne de la carte : une zone réelle, ou une zone de repère grisée quand la période n'a pas de donnée. */
interface ZoneRow {
  label: string;
  name: string;
  /** Largeur du segment de la barre. */
  width: string;
  /** Pourcentage affiché, ou un tiret sans donnée. */
  percentLabel: string;
  colorVariable: string;
}

/** Zones de repère affichées sans donnée : mêmes noms et même ordre que la légende réelle (Z5 en premier). */
const PLACEHOLDER_ZONES: readonly { label: string; name: string }[] = [
  { label: 'Z5', name: TEXTS.dashboard.zones.names.z5 },
  { label: 'Z4', name: TEXTS.dashboard.zones.names.z4 },
  { label: 'Z3', name: TEXTS.dashboard.zones.names.z3 },
  { label: 'Z2', name: TEXTS.dashboard.zones.names.z2 },
  { label: 'Z1', name: TEXTS.dashboard.zones.names.z1 },
];
const NO_VALUE = '—';
const PLACEHOLDER_COLOR = '--sh-border';
const EMPTY_STATUS = TEXTS.dashboard.zones.empty;

/**
 * Carte « Zones d'entraînement » : barre segmentée des zones cardiaques, anneau du temps en zone optimale,
 * légende textuelle (équivalent accessible de la barre) et message de statut. Sans donnée, le même gabarit
 * s'affiche avec les zones de repère grisées et des tirets ; sans réponse encore, un état de chargement ;
 * en cas d'erreur, un message et « Réessayer ».
 */
@Component({
  selector: 'sh-zones-card',
  imports: [IconComponent, NzButtonComponent],
  templateUrl: './zones-card.component.html',
  styleUrl: './zones-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZonesCardComponent {
  protected readonly t = TEXTS;
  /** Absente tant que la réponse n'est pas reçue. */
  readonly view = input<ZonesCardView | undefined>(undefined);
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly retry = output<void>();
  readonly expand = output<void>();

  /** Vrai sans donnée de zone sur la période : la carte garde son gabarit, en grisé. */
  protected readonly isEmpty = computed(() => (this.view()?.zones.length ?? 0) === 0);

  protected readonly rows = computed<ZoneRow[]>(() => {
    const data = this.view();
    if (data === undefined || data.zones.length === 0) {
      const width = `${100 / PLACEHOLDER_ZONES.length}%`;
      return PLACEHOLDER_ZONES.map((zone) => ({
        label: zone.label,
        name: zone.name,
        width,
        percentLabel: `${NO_VALUE} %`,
        colorVariable: PLACEHOLDER_COLOR,
      }));
    }
    return data.zones.map((zone) => ({
      label: zone.label,
      name: zone.name,
      width: `${zone.percent}%`,
      percentLabel: `${zone.percent} %`,
      colorVariable: zone.colorVariable,
    }));
  });

  protected readonly optimalLabel = computed(() => {
    const percent = this.view()?.optimalPercent;
    return percent === null || percent === undefined ? `${NO_VALUE} %` : `${percent} %`;
  });

  protected readonly ringPercent = computed(() => `${this.view()?.optimalPercent ?? 0}%`);

  protected readonly statusLabel = computed(() => this.view()?.statusMessage ?? EMPTY_STATUS);
}
