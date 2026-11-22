import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { readCssVar } from '@shared/utils/css-var';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { ChartData, ChartOptions } from 'chart.js';
import type { SportSplitView } from '../../models/sport-split.model';
import { TEXTS } from '@shared/texts/texts';

/**
 * Carte « Répartition par sport » : donut à quatre segments (course, cyclisme, natation, autres), durée totale
 * au centre, et légende textuelle avec les pourcentages. Un sport sans durée n'apparaît pas.
 */
@Component({
  selector: 'sh-sport-split-card',
  imports: [ChartComponent, IconComponent, NzButtonComponent],
  templateUrl: './sport-split-card.component.html',
  styleUrl: './sport-split-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportSplitCardComponent {
  protected readonly t = TEXTS;
  /** Familles affichées en grisé quand aucune séance n'est enregistrée sur la période. */
  protected readonly placeholderLabels = TEXTS.dashboard.sportSplit.placeholders;
  /** Absent tant que la réponse n'est pas reçue : la carte affiche alors son état de chargement. */
  readonly split = input<SportSplitView | undefined>(undefined);
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly retry = output<void>();
  readonly expand = output<void>();

  protected readonly chartData = computed<ChartData<'doughnut'>>(() => {
    const shares = this.split()?.shares ?? [];
    return {
      labels: shares.map((share) => share.label),
      datasets: [
        {
          data: shares.map((share) => share.percent),
          backgroundColor: shares.map((share) => readCssVar(share.colorVariable)),
          borderWidth: 0,
        },
      ],
    };
  });

  protected readonly chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    cutout: '68%',
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
  };
}
