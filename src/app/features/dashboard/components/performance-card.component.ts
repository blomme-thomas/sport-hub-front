import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { readCssVar } from '@shared/utils/css-var';
import type { ChartData, ChartOptions, ChartType } from 'chart.js';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { PERFORMANCE_SERIES_LABEL } from '../data-access/performance.mapper';
import { PerformanceState } from '../data-access/performance.state';

/**
 * Options du graphique aux couleurs du thème. Pas de grille verticale ni de bordure d'axe ; les graduations
 * horizontales sont fines et pointillées, pour que la donnée reste le seul élément qui attire le regard.
 */
function performanceChartOptions(): ChartOptions {
  const text = readCssVar('--sh-chart-text');
  const grid = readCssVar('--sh-chart-grid');
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: text, padding: 8 },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: grid, lineWidth: 1, drawTicks: false, tickBorderDash: [4, 4] },
        ticks: { color: text, padding: 8, callback: (value) => `${value} h` },
      },
    },
  };
}

/** Courbe lissée ; le mode monotone évite les dépassements sous zéro. */
const CURVE_TENSION = 0.4;
const POINT_RADIUS = 3;
/** Barres arrondies et fines, pour la vue par semaine. */
const BAR_RADIUS = 6;
const BAR_MAX_THICKNESS = 40;

/** Carte « Vos performances » : durée par jour en vue semaine, par semaine ISO en vue mois. */
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

  /** Barres par semaine en vue mois, courbe par jour en vue semaine. */
  protected readonly chartType = computed<ChartType>(() =>
    this.state.grouping() === 'week' ? 'bar' : 'line',
  );

  protected readonly chartData = computed<ChartData>(() => {
    const series = this.state.series();
    if (!series) {
      return { labels: [], datasets: [] };
    }
    const color = readCssVar('--sh-chart-series-1');
    if (this.state.grouping() === 'week') {
      return {
        labels: series.labels,
        datasets: [
          {
            label: PERFORMANCE_SERIES_LABEL,
            data: series.hours,
            backgroundColor: color,
            borderRadius: BAR_RADIUS,
            borderSkipped: false,
            maxBarThickness: BAR_MAX_THICKNESS,
          },
        ],
      };
    }
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
