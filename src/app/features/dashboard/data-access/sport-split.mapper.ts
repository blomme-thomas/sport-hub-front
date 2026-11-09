import type { TypeVolumeApi } from '../models/training-stats.api-model';
import type { SportFamily, SportShare, SportSplitView } from '../models/sport-split.model';

const FAMILY_ORDER: readonly SportFamily[] = ['running', 'cycling', 'swimming', 'other'];

const FAMILY_LABELS: Record<SportFamily, string> = {
  running: 'Course à pied',
  cycling: 'Cyclisme',
  swimming: 'Natation',
  other: 'Autres',
};

const FAMILY_COLORS: Record<SportFamily, string> = {
  running: '--sh-accent-text',
  cycling: '--sh-success',
  swimming: '--sh-orange',
  other: '--sh-violet',
};

const RUNNING_TYPES = ['running', 'trail_running', 'treadmill_running'];
const CYCLING_TYPES = [
  'cycling',
  'road_biking',
  'indoor_cycling',
  'virtual_ride',
  'gravel_cycling',
  'mountain_biking',
];
const SWIMMING_TYPES = ['lap_swimming', 'swimming', 'open_water_swimming'];

/** Famille d'un type d'activité Garmin ; tout type non listé est « autres ». */
export function familyOf(type: string): SportFamily {
  if (RUNNING_TYPES.includes(type)) return 'running';
  if (CYCLING_TYPES.includes(type)) return 'cycling';
  if (SWIMMING_TYPES.includes(type)) return 'swimming';
  return 'other';
}

/**
 * Répartition par famille de sport, à partir des durées par type de la période.
 * Les pourcentages sont entiers et totalisent 100 (méthode des plus grands restes). Une famille sans durée
 * n'apparaît pas. `formatTotal` formate la durée totale affichée au centre du donut.
 */
export function toSportSplit(
  byType: readonly TypeVolumeApi[],
  formatTotal: (seconds: number) => string,
): SportSplitView {
  const seconds = new Map<SportFamily, number>();
  for (const item of byType) {
    const family = familyOf(item.type);
    seconds.set(family, (seconds.get(family) ?? 0) + item.durationSeconds);
  }
  const present = FAMILY_ORDER.filter((family) => (seconds.get(family) ?? 0) > 0);
  const total = present.reduce((sum, family) => sum + (seconds.get(family) ?? 0), 0);
  if (total === 0) {
    return { shares: [], totalLabel: formatTotal(0) };
  }

  const exact = present.map((family) => ({
    family,
    raw: ((seconds.get(family) ?? 0) / total) * 100,
  }));
  const floors = exact.map((item) => Math.floor(item.raw));
  let missing = 100 - floors.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact
    .map((item, index) => ({ index, remainder: item.raw - Math.floor(item.raw) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { index } of byRemainder) {
    if (missing === 0) break;
    floors[index] = (floors[index] ?? 0) + 1;
    missing -= 1;
  }

  const shares: SportShare[] = exact.map((item, index) => ({
    family: item.family,
    label: FAMILY_LABELS[item.family],
    percent: floors[index] ?? 0,
    colorVariable: FAMILY_COLORS[item.family],
  }));
  return { shares, totalLabel: formatTotal(total) };
}
