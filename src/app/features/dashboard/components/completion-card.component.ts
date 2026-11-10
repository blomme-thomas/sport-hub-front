import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import type { CompletionView } from '../data-access/completion.mapper';

/**
 * Carte « Objectif » : pourcentage de séances réalisées parmi les séances dues de la période choisie, avec
 * l'anneau de progression et le détail chiffré. Les objectifs généraux viendront s'ajouter à côté (hors périmètre).
 */
@Component({
  selector: 'sh-completion-card',
  imports: [IconComponent],
  templateUrl: './completion-card.component.html',
  styleUrl: './completion-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletionCardComponent {
  readonly view = input<CompletionView | undefined>(undefined);
  readonly loading = input(false);
}
