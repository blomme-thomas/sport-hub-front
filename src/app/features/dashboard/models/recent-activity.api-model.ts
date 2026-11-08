/** Une activité de `GET /api/activities` (`ActivitySummaryResponseDto` côté back). */
export interface ActivitySummaryApi {
  id: string;
  garminActivityId: string;
  type: string;
  startedAt: string;
  durationSeconds: number;
  distanceMeters: number | null;
}

/** Réponse paginée de `GET /api/activities`. */
export interface ActivityListApi {
  items: ActivitySummaryApi[];
  page: number;
  pageSize: number;
  total: number;
}
