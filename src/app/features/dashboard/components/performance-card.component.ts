import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { readCssVar } from '@shared/utils/css-var';
import type { ChartData, ChartOptions } from 'chart.js';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { PERFORMANCE_SERIES_LABEL } from '../data-access/performance.mapper';
import {
  PERFORMANCE_PERIODS,
  PerformanceState,
  type PerformancePeriod,
} from '../data-access/performance.state';

const PERIOD_LABELS: Record<PerformancePeriod, string> = {
  '7d': 'Cette semaine',
  '30d': '30 derniers jours',
  '3m': '3 derniers mois',
  '1y': '1 an',
};

const CHART_OPTIONS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: (value) => `${value} h` },
    },
  },
};

/** Courbe lissée ; le mode monotone évite les dépassements sous zéro. */
const CURVE_TENSION = 0.4;
const POINT_RADIUS = 3;

/** Carte « Vos performances » : durée par jour sur la période choisie localement. */
@Component({
  selector: 'sh-performance-card',
  imports: [
    IconComponent,
    FormsModule,
    ChartComponent,
    NzButtonComponent,
    NzOptionComponent,
    NzSelectComponent,
  ],
  templateUrl: './performance-card.component.html',
  styleUrl: './performance-card.component.scss',
  providers: [PerformanceState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceCardComponent {
  protected readonly state = inject(PerformanceState);
  protected readonly periodOptions = PERFORMANCE_PERIODS.map((value) => ({
    value,
    label: PERIOD_LABELS[value],
  }));
  protected readonly chartOptions = CHART_OPTIONS;

  protected readonly chartData = computed<ChartData<'line'>>(() => {
    const series = this.state.series();
    if (!series) {
      return { labels: [], datasets: [] };
    }
    const color = readCssVar('--sh-chart-series-1');
    return {
      labels: series.labels,
      datasets: [
        {
          label: PERFORMANCE_SERIES_LABEL,
          data: series.hours,
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          tension: CURVE_TENSION,
          cubicInterpolationMode: 'monotone',
          pointRadius: POINT_RADIUS,
        },
      ],
    };
  });
}
