/** Occurrence d'une séance sur la période, telle que renvoyée par `GET /api/sessions?from&to`. */
export interface SessionOccurrenceApi {
  sessionId: string;
  date: string;
  /** Heure `HH:mm`, `null` si la séance n'a pas d'heure (elle n'apparaît pas sur la grille). */
  startTime: string | null;
  durationMinutes: number;
  disciplineTypeKey: string;
  recurrence: string;
  status: string;
}

export interface SessionOccurrencesResponseApi {
  items: SessionOccurrenceApi[];
}

export interface DisciplineApi {
  typeKey: string;
  label: string;
}

export interface DisciplineListResponseApi {
  items: DisciplineApi[];
}
