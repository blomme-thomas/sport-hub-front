import { readCssVar } from '@shared/utils/css-var';
import type { ChartData, ChartOptions } from 'chart.js';
import type { HeartRateSampleApi } from '../models/recent-activity.api-model';

/** Données d'une courbe de fréquence cardiaque : une valeur par échantillon, sans étiquette de temps. */
export function heartRateChartData(samples: readonly HeartRateSampleApi[]): ChartData<'line'> {
  return {
    labels: samples.map((_, index) => String(index)),
    datasets: [
      {
        data: samples.map((sample) => sample.bpm),
        borderColor: readCssVar('--sh-danger'),
        backgroundColor: 'transparent',
        tension: 0.35,
        // Pas de découpe sur les bords : le trait garde sa largeur même à une valeur basse.
        clip: false,
      },
    ],
  };
}

/** Miniature de la ligne de séance : courbe seule, sans axes. */
export const SPARKLINE_OPTIONS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  layout: { padding: { top: 3, bottom: 3, left: 2, right: 2 } },
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
  scales: { x: { display: false }, y: { display: false } },
};

/** Courbe détaillée de la modale : axe des bpm lisible, sans étiquettes de temps. */
export function detailChartOptions(): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: { padding: { top: 6, bottom: 6, left: 4, right: 8 } },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
    scales: {
      x: { display: false },
      y: {
        ticks: { color: readCssVar('--sh-chart-text') },
        grid: { color: readCssVar('--sh-chart-grid') },
      },
    },
  };
}
