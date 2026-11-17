import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { WeeklyGoalView } from '../../models/weekly-goal.model';

/**
 * Carte « Objectif de la semaine » : anneau de progression (plafonné visuellement à 100 %), durée réalisée sur la
 * cible et message de statut. Sans objectif, elle propose de le définir.
 * Présentation pure : l'état vit dans la page.
 */
@Component({
  selector: 'sh-weekly-goal-card',
  imports: [IconComponent, NzButtonComponent, RouterLink],
  templateUrl: './weekly-goal-card.component.html',
  styleUrl: './weekly-goal-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyGoalCardComponent {
  /** Absente tant que la réponse n'est pas reçue. */
  readonly view = input<WeeklyGoalView | null>(null);
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly retry = output<void>();

  /** Pourcentage de l'anneau : plafonné à 100 pour le dessin, le texte affiche la valeur réelle. */
  protected readonly ringPercent = computed(() => Math.min(100, this.view()?.percent ?? 0));
}
