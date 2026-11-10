/** Activité telle que lue par la fiche (sous-ensemble de `GET /api/activities` et `GET /api/activities/:id`). */
export interface SessionActivityApi {
  id: string;
  /** Type Garmin, comparé à la discipline de la séance pour proposer les activités associables. */
  type: string;
  startedAt: string;
  durationSeconds: number;
  distanceMeters: number | null;
  averageHeartRate: number | null;
}

/** Réponse paginée de `GET /api/activities`, dans la forme utile à la fiche. */
export interface SessionActivityListApi {
  items: SessionActivityApi[];
  page: number;
  pageSize: number;
  total: number;
}
