import type { ChartData, ChartOptions } from 'chart.js';
import { readCssVar } from '@shared/utils/css-var';
import type { ChartKey, ChartModel } from '../models/training-stats.model';

export type ChartKind = 'bar' | 'horizontal-bar';

export const CHART_KIND: Readonly<Record<ChartKey, ChartKind>> = {
  sessions: 'bar',
  duration: 'bar',
  byType: 'horizontal-bar',
};

/**
 * Traduit un modèle de graphique en données Chart.js. Les couleurs viennent des variables CSS `cssVar` de
 * chaque série, lues à la construction : aucune valeur de couleur n'est écrite dans le TypeScript.
 */
export function chartDataOf(model: ChartModel): ChartData<'bar'> {
  return {
    labels: model.labels,
    datasets: model.series.map((series) => ({
      label: series.label,
      data: series.values,
      backgroundColor: readCssVar(series.cssVar),
    })),
  };
}

/**
 * Options Chart.js d'un graphique : barres verticales ou horizontales, axes et grille aux couleurs du thème.
 * La légende n'apparaît qu'avec plusieurs séries ; les libellés restent lisibles via le tableau de valeurs.
 */
export function chartOptionsOf(model: ChartModel, kind: ChartKind): ChartOptions<'bar'> {
  const text = readCssVar('--sh-chart-text');
  const grid = readCssVar('--sh-chart-grid');
  const axis = { ticks: { color: text }, grid: { color: grid } };

  return {
    indexAxis: kind === 'horizontal-bar' ? 'y' : 'x',
    plugins: { legend: { display: model.series.length > 1 } },
    scales: { x: axis, y: axis },
  };
}
