import type { ZonesCardView, ZoneShareView } from '../models/zones-card.model';

/**
 * Index (0 à 4) des zones considérées comme « optimales » pour la carte : Z2 et Z3, zones aérobies de base.
 * Hypothèse de l'implémentation, à confirmer avec la maquette.
 */
export const OPTIMAL_ZONE_INDEXES: readonly number[] = [1, 2];

/** Part minimale du temps en zone optimale pour le message « Bon équilibre ». */
export const GOOD_BALANCE_THRESHOLD_PERCENT = 60;

export const GOOD_BALANCE_MESSAGE = 'Bon équilibre en zone optimale';
export const REBALANCE_MESSAGE = 'Zone optimale à renforcer';

const ZONE_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'] as const;

/** Noms des zones, repris de la maquette (voir `heart-rate-chart.config.ts`). */
const ZONE_NAMES = ['Récupération', 'Endurance', 'Tempo', 'Seuil', 'Puissance'] as const;

const ZONE_COLORS = [
  '--sh-text-muted',
  '--sh-success',
  '--sh-orange',
  '--sh-danger',
  '--sh-violet',
] as const;

/**
 * Convertit `hrTimeInZone` (zones 1 à 5, `null` pour une zone sans donnée) en vue de la carte Zones.
 * Les pourcentages sont calculés sur la somme des zones renseignées ; sans durée, la vue est vide.
 */
export function toZonesCardView(hrTimeInZone: readonly (number | null)[]): ZonesCardView {
  const seconds = ZONE_LABELS.map((_, index) => hrTimeInZone[index] ?? 0);
  const total = seconds.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return { zones: [], optimalPercent: null, statusMessage: null };
  }

  // Ordre d'affichage Z5 → Z1 (barre et légende), demandé à la relecture de la maquette.
  const zones: ZoneShareView[] = ZONE_LABELS.map((label, index) => ({
    label,
    name: ZONE_NAMES[index] ?? '',
    percent: Math.round(((seconds[index] ?? 0) / total) * 100),
    colorVariable: ZONE_COLORS[index] ?? '--sh-text-muted',
  })).reverse();

  const optimalExact = OPTIMAL_ZONE_INDEXES.reduce(
    (sum, index) => sum + ((seconds[index] ?? 0) / total) * 100,
    0,
  );
  const optimalPercent = Math.round(optimalExact);

  return {
    zones,
    optimalPercent,
    statusMessage:
      optimalPercent >= GOOD_BALANCE_THRESHOLD_PERCENT ? GOOD_BALANCE_MESSAGE : REBALANCE_MESSAGE,
  };
}
