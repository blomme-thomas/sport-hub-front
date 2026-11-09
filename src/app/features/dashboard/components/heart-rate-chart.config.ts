import { readCssVar } from '@shared/utils/css-var';
import type { ChartData, ChartOptions } from 'chart.js';
import type { ZoneFloors } from '../models/heart-rate-zones.model';
import { zoneOf } from '../models/heart-rate-zones.model';
import type { HeartRateSampleApi } from '../models/recent-activity.api-model';

/** Tokens de couleur des zones 1 à 5, repris de la maquette (Récupération, Endurance, Tempo, Seuil, Puissance). */
const ZONE_TOKENS = [
  '--sh-text-muted',
  '--sh-success',
  '--sh-orange',
  '--sh-danger',
  '--sh-violet',
] as const;
/** Couleur quand les zones sont inconnues. */
const NEUTRAL_TOKEN = '--sh-danger';

/** Couleur d'une fréquence cardiaque selon sa zone, ou la couleur neutre si les zones sont inconnues. */
export function heartRateColor(bpm: number, floors: ZoneFloors | null): string {
  const zone = zoneOf(bpm, floors);
  return readCssVar(zone === null ? NEUTRAL_TOKEN : (ZONE_TOKENS[zone - 1] ?? NEUTRAL_TOKEN));
}

/**
 * Données d'une courbe de fréquence cardiaque : une valeur par échantillon, sans étiquette de temps.
 * Chaque segment prend la couleur de la zone de son point de départ.
 */
export function heartRateChartData(
  samples: readonly HeartRateSampleApi[],
  floors: ZoneFloors | null,
): ChartData<'line'> {
  const neutral = readCssVar(NEUTRAL_TOKEN);
  const colors = samples.map((sample) => heartRateColor(sample.bpm, floors));
  return {
    labels: samples.map((_, index) => String(index)),
    datasets: [
      {
        data: samples.map((sample) => sample.bpm),
        borderColor: neutral,
        backgroundColor: 'transparent',
        tension: 0.35,
        // Pas de découpe sur les bords : le trait garde sa largeur même à une valeur basse.
        clip: false,
        segment: {
          borderColor: (context: { p0DataIndex: number }) => colors[context.p0DataIndex] ?? neutral,
        },
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
  elements: { point: { radius: 0 }, line: { borderWidth: 2.5 } },
  // Marge verticale : la courbe occupe toute la hauteur sans toucher les bords.
  scales: { x: { display: false }, y: { display: false, grace: '10%' } },
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
