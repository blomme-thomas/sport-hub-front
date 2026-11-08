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
