/** Occurrence d'une séance sur la période, telle que renvoyée par `GET /api/sessions?from&to`. */
export interface SessionOccurrenceApi {
  sessionId: string;
  title: string | null;
  date: string;
  /** Heure de début `HH:mm`, obligatoire. */
  startTime: string;
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
