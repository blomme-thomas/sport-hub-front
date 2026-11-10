import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import type { ZonesCardView } from '../models/zones-card.model';

/**
 * Carte « Zones d'entraînement » : barre segmentée des zones cardiaques 1 à 5, anneau du temps en zone optimale,
 * légende textuelle (équivalent accessible de la barre) et message de statut. Sans donnée, un état vide explicite.
 */
@Component({
  selector: 'sh-zones-card',
  imports: [IconComponent],
  templateUrl: './zones-card.component.html',
  styleUrl: './zones-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZonesCardComponent {
  readonly view = input.required<ZonesCardView>();
}
