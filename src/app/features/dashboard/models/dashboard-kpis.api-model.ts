import type { SportFamilyApi } from './training-stats.api-model';

/** Durée et séances d'un type d'activité sur la période (`DashboardSportResponseDto` côté back). */
export interface DashboardSportApi {
  type: string;
  family: SportFamilyApi;
  count: number;
  durationSeconds: number;
}

/** Réponse de `GET /api/stats/dashboard` (`DashboardStatsResponseDto` côté back). */
export interface DashboardKpisResponseApi {
  period: string;
  from: string;
  to: string;
  totals: {
    count: number;
    durationSeconds: number;
    calories: number | null;
    elevationGainMeters: number | null;
  };
  averageHeartRate: number | null;
  /** Ventilation par type sur la période choisie, pour la carte Répartition par sport. */
  bySport: DashboardSportApi[];
  daily: {
    date: string;
    count: number;
    durationSeconds: number;
    calories: number | null;
  }[];
  variation: {
    direction: 'up' | 'down' | 'flat' | 'unknown';
    percent: number | null;
  };
}
