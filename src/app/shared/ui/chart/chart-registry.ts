import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

/** Contrôleurs, éléments, échelles et plugins réellement utilisés : rien d'autre n'est enregistré (tree-shaking). */
export const CHART_REGISTERED_ITEMS = [
  ArcElement,
  BarController,
  DoughnutController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
];

Chart.register(...CHART_REGISTERED_ITEMS);
