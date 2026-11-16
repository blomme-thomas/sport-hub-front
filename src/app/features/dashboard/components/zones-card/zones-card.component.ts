import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { ZonesCardView } from '../../models/zones-card.model';

/**
 * Carte « Zones d'entraînement » : barre segmentée des zones cardiaques 1 à 5, anneau du temps en zone optimale,
 * légende textuelle (équivalent accessible de la barre) et message de statut. Sans donnée, un état vide explicite ;
 * sans réponse encore, un état de chargement ; en cas d'erreur, un message et « Réessayer ».
 */
@Component({
  selector: 'sh-zones-card',
  imports: [IconComponent, NzButtonComponent],
  templateUrl: './zones-card.component.html',
  styleUrl: './zones-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZonesCardComponent {
  /** Absente tant que la réponse n'est pas reçue. */
  readonly view = input<ZonesCardView | undefined>(undefined);
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly retry = output<void>();
}
