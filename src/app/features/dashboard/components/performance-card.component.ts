import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { readCssVar } from '@shared/utils/css-var';
import type { ChartData, ChartOptions } from 'chart.js';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { PERFORMANCE_SERIES_LABEL } from '../data-access/performance.mapper';
import { PerformanceState } from '../data-access/performance.state';

/** Durée de la transition quand les données changent (jour ↔ semaine), sans recréer le graphique. */
const UPDATE_ANIMATION_MS = 350;

/**
 * Options du graphique aux couleurs du thème. Pas de grille verticale ni de bordure d'axe ; les graduations
 * horizontales sont fines et pointillées, pour que la donnée reste le seul élément qui attire le regard.
 */
function performanceChartOptions(): ChartOptions<'line'> {
  const text = readCssVar('--sh-chart-text');
  const grid = readCssVar('--sh-chart-grid');
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: UPDATE_ANIMATION_MS },
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

/** Carte « Vos performances » : durée par jour en vue semaine, par semaine ISO en vue mois (même type de graphique). */
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
