import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { readCssVar } from '@shared/utils/css-var';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { ChartData, ChartOptions } from 'chart.js';
import type { WeeklyGoalView } from '../../models/weekly-goal.model';

/**
 * Carte « Objectif de la semaine » : anneau de progression (plafonné visuellement à 100 %), durée réalisée sur la
 * cible, message de statut et mini-courbe des huit dernières semaines. Sans objectif, elle propose de le définir.
 * Présentation pure : l'état vit dans la page.
 */
@Component({
  selector: 'sh-weekly-goal-card',
  imports: [ChartComponent, IconComponent, NzButtonComponent, RouterLink],
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

  protected readonly chartData = computed<ChartData<'line'>>(() => {
    const trend = this.view()?.trend ?? [];
    return {
      labels: trend.map((point) => point.label),
      datasets: [
        {
          label: 'Durée réalisée (h)',
          data: trend.map((point) => point.hours),
          borderColor: readCssVar('--sh-accent-text'),
          backgroundColor: 'transparent',
          tension: 0.3,
        },
      ],
    };
  });

  protected readonly chartOptions: ChartOptions<'line'> = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };
}
