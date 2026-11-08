import type { VariationView } from './training-stats.model';

export type KpiTone = 'accent' | 'success' | 'orange' | 'violet' | 'danger';

/** Indicateur du bandeau, prêt à l'affichage. `series` alimente la mini-courbe (`null` = pas de série). */
export interface DashboardKpi {
  id: 'sessions' | 'duration' | 'calories' | 'elevation' | 'heartRate';
  label: string;
  value: string;
  unit: string | null;
  tone: KpiTone;
  /** Présente uniquement pour la durée : le back ne fournit que cette variation. */
  variation: VariationView | null;
  series: (number | null)[] | null;
}
