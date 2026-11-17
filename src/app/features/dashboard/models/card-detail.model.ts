import type { VariationView } from './training-stats.model';

/** Ligne d'une vue détaillée de zones : temps, part et seuil bas de la zone. */
export interface ZoneDetailRow {
  label: string;
  name: string;
  percent: number;
  durationLabel: string;
  /** Seuil bas de la zone en bpm, `null` si les zones de l'utilisateur ne sont pas disponibles. */
  floorBpm: number | null;
  colorVariable: string;
}

/** Contenu de la modale d'agrandissement d'une carte, calculé par le tableau de bord à l'ouverture. */
export type CardDetail =
  | {
      kind: 'kpi';
      title: string;
      value: string;
      unit: string | null;
      /** Présente uniquement pour la durée : le back ne fournit que cette variation. */
      variation: VariationView | null;
    }
  | {
      kind: 'split';
      title: string;
      totalLabel: string;
      rows: { label: string; percent: number; durationLabel: string; colorVariable: string }[];
    }
  | {
      kind: 'zones';
      title: string;
      optimalPercent: number | null;
      statusMessage: string | null;
      rows: ZoneDetailRow[];
    };
