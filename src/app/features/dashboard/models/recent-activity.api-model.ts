/** Une activité de `GET /api/activities` (`ActivitySummaryResponseDto` côté back). */
export interface ActivitySummaryApi {
  id: string;
  garminActivityId: string;
  type: string;
  /** Famille déduite du type : course, vélo, natation ou autre. */
  family: 'running' | 'cycling' | 'swimming' | 'other';
  startedAt: string;
  durationSeconds: number;
  distanceMeters: number | null;
  averageHeartRate: number | null;
}

/** Réponse paginée de `GET /api/activities`. */
export interface ActivityListApi {
  items: ActivitySummaryApi[];
  page: number;
  pageSize: number;
  total: number;
}

/** Échantillon de fréquence cardiaque, horodaté. */
export interface HeartRateSampleApi {
  occurredAt: string;
  bpm: number;
  /** Distance parcourue depuis le début, si le back la fournit : active l'axe en km. */
  distanceMeters?: number | null;
}

/** Détail d'une activité (`GET /api/activities/:id`, `ActivityDetailResponseDto` côté back). */
export interface ActivityDetailApi {
  id: string;
  garminActivityId: string;
  type: string;
  /** Famille déduite du type : course, vélo, natation ou autre. */
  family: 'running' | 'cycling' | 'swimming' | 'other';
  startedAt: string;
  durationSeconds: number;
  distanceMeters: number | null;
  calories: number | null;
  elevationGainMeters: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  /** Secondes passées dans chaque zone de fréquence cardiaque, `null` si inconnue. */
  hrTimeInZone: (number | null)[];
  /** Série de fréquence cardiaque, `null` si absente. */
  heartRateSeries: HeartRateSampleApi[] | null;
}
