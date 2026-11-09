import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { readCssVar } from '@shared/utils/css-var';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import type { ChartData, ChartOptions } from 'chart.js';
import type { SportSplitView } from '../models/sport-split.model';

/**
 * Carte « Répartition par sport » : donut à quatre segments (course, cyclisme, natation, autres), durée totale
 * au centre, et légende textuelle avec les pourcentages. Un sport sans durée n'apparaît pas.
 */
@Component({
  selector: 'sh-sport-split-card',
  imports: [ChartComponent, IconComponent],
  templateUrl: './sport-split-card.component.html',
  styleUrl: './sport-split-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportSplitCardComponent {
  readonly split = input.required<SportSplitView>();

  protected readonly chartData = computed<ChartData<'doughnut'>>(() => {
    const shares = this.split().shares;
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
