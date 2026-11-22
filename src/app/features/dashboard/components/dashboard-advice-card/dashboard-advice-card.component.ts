import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { DashboardAdvice } from '../../models/dashboard-advice.model';
import { fill, TEXTS } from '@shared/texts/texts';

/**
 * Carte « Conseil IA personnalisé » : le dernier conseil stocké, sa date, et un bouton pour le régénérer.
 * Un conseil « insuffisant » s'affiche en clair, sans erreur. Le texte est affiché tel quel (pas de HTML).
 * Présentation pure : l'état vit dans la page.
 */
@Component({
  selector: 'sh-dashboard-advice-card',
  imports: [IconComponent, NzButtonComponent],
  templateUrl: './dashboard-advice-card.component.html',
  styleUrl: './dashboard-advice-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardAdviceCardComponent {
  protected readonly t = TEXTS;
  protected readonly fill = fill;
  readonly advice = input<DashboardAdvice | null>(null);
  readonly loading = input(false);
  readonly generating = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly generate = output<void>();
  readonly retry = output<void>();

  protected readonly generatedLabel = computed(() => {
    const advice = this.advice();
    return advice === null
      ? ''
      : new Date(advice.generatedAt).toLocaleString('fr-FR', {
          dateStyle: 'short',
          timeStyle: 'short',
        });
  });
}
