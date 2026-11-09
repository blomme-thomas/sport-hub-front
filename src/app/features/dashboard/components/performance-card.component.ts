import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { readCssVar } from '@shared/utils/css-var';
import type { ChartData, ChartOptions } from 'chart.js';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { PERFORMANCE_SERIES_LABEL } from '../data-access/performance.mapper';
import { PerformanceState } from '../data-access/performance.state';

/**
 * Options du graphique aux couleurs du thème : grille et graduations discrètes, sans bordure d'axe,
 * pour que la courbe reste le seul élément qui attire le regard.
 */
function performanceChartOptions(): ChartOptions<'line'> {
  const text = readCssVar('--sh-chart-text');
  const grid = readCssVar('--sh-chart-grid');
  const gridLine = { color: grid, lineWidth: 1 };
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        border: { display: false },
        grid: gridLine,
        ticks: { color: text },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: gridLine,
        ticks: { color: text, callback: (value) => `${value} h` },
      },
    },
  };
}

/** Courbe lissée ; le mode monotone évite les dépassements sous zéro. */
const CURVE_TENSION = 0.4;
const POINT_RADIUS = 3;

/** Carte « Vos performances » : durée par jour sur la période choisie localement. */
@Component({
  selector: 'sh-performance-card',
  imports: [IconComponent, ChartComponent, NzButtonComponent],
  templateUrl: './performance-card.component.html',
  styleUrl: './performance-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceCardComponent {
  protected readonly state = inject(PerformanceState);
  protected readonly chartOptions = performanceChartOptions();

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
