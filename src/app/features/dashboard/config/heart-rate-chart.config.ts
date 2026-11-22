import { readCssVar } from '@shared/utils/css-var';
import type { ChartData, ChartOptions } from 'chart.js';
import type { ZoneFloors } from '../models/heart-rate-zones.model';
import { zoneOf } from '../models/heart-rate-zones.model';
import type { HeartRateSampleApi } from '../models/recent-activity.api-model';
import { TEXTS } from '@shared/texts/texts';

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
const METERS_PER_KILOMETER = 1000;
const MS_PER_MINUTE = 60_000;

/** Couleur d'une fréquence cardiaque selon sa zone, ou la couleur neutre si les zones sont inconnues. */
export function heartRateColor(bpm: number, floors: ZoneFloors | null): string {
  const zone = zoneOf(bpm, floors);
  return readCssVar(zone === null ? NEUTRAL_TOKEN : (ZONE_TOKENS[zone - 1] ?? NEUTRAL_TOKEN));
}

/** Axe horizontal de la courbe détaillée : durée écoulée, ou distance en km si elle est fournie. */
export type HeartRateAxis = 'time' | 'distance';

/** L'axe en km n'est proposé que si chaque échantillon porte sa distance. */
export function hasDistanceAxis(samples: readonly HeartRateSampleApi[]): boolean {
  return samples.length > 1 && samples.every((sample) => typeof sample.distanceMeters === 'number');
}

/** Libellé de l'axe horizontal selon l'axe choisi. */
export function axisTitle(axis: HeartRateAxis): string {
  return axis === 'distance'
    ? TEXTS.dashboard.detail.distanceAxis
    : TEXTS.dashboard.detail.timeAxis;
}

/**
 * Données d'une courbe de fréquence cardiaque, une valeur par échantillon. Avec `startedAt`, l'abscisse est la
 * durée écoulée (en minutes) ; sinon l'indice. L'axe `distance` prend les kilomètres. Chaque segment prend la
 * couleur de sa zone de départ.
 */
export function heartRateChartData(
  samples: readonly HeartRateSampleApi[],
  floors: ZoneFloors | null,
  startedAt?: string,
  axis: HeartRateAxis = 'time',
): ChartData<'line'> {
  const neutral = readCssVar(NEUTRAL_TOKEN);
  const colors = samples.map((sample) => heartRateColor(sample.bpm, floors));
  const start = startedAt === undefined ? null : Date.parse(startedAt);
  return {
    labels: samples.map((sample, index) => {
      if (axis === 'distance') {
        return ((sample.distanceMeters ?? 0) / METERS_PER_KILOMETER).toFixed(2);
      }
      // Sans heure de départ (miniature), l'étiquette reste l'indice de l'échantillon.
      return start === null
        ? String(index)
        : String(Math.round((Date.parse(sample.occurredAt) - start) / MS_PER_MINUTE));
    }),
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

/** Courbe détaillée de la modale : axe des bpm lisible, axe horizontal titré (durée ou distance). */
export function detailChartOptions(axis: HeartRateAxis): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: { padding: { top: 6, bottom: 16, left: 4, right: 8 } },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
    scales: {
      x: {
        title: { display: true, text: axisTitle(axis), color: readCssVar('--sh-chart-text') },
        ticks: { color: readCssVar('--sh-chart-text'), autoSkip: true, maxTicksLimit: 8 },
        grid: { display: false },
      },
      y: {
        ticks: { color: readCssVar('--sh-chart-text') },
        grid: { color: readCssVar('--sh-chart-grid') },
      },
    },
  };
}
