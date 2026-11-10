export type SessionStatusApi = 'planifiee' | 'realisee' | 'manquee';

export type ModuleTypeApi = 'echauffement' | 'educatifs' | 'series' | 'retour_au_calme' | 'autre';

export interface ZoneRangeApi {
  min: number;
  max: number;
}

/** Zones cibles d'un module ; une zone absente n'est pas définie. */
export interface TargetZonesApi {
  heartRate?: ZoneRangeApi;
  pace?: ZoneRangeApi;
  power?: ZoneRangeApi;
}

export interface SessionModuleApi {
  position: number;
  type: ModuleTypeApi;
  durationMinutes: number;
  instruction: string;
  targetZones: TargetZonesApi | null;
  perceivedEffort: number | null;
}

export interface ChangeLogEntryApi {
  changedAt: string;
  field: string;
  previousValue: string | null;
}

/** Séance telle que renvoyée par `GET /api/sessions/:id` et `PUT /api/sessions/:id/modules`. */
export interface SessionApi {
  id: string;
  date: string;
  disciplineTypeKey: string;
  durationMinutes: number;
  startTime: string | null;
  status: SessionStatusApi;
  modifiedManually: boolean;
  description: string | null;
  equipment: string | null;
  attentionPoints: string | null;
  modules: SessionModuleApi[];
  changeLog: ChangeLogEntryApi[];
  /** Distance cible en mètres ; `null` si non renseignée. */
  targetDistanceMeters: number | null;
  /** Répartition cible du temps par zone de FC, Z1 à Z5 ; `null` si absente. */
  targetHrZonePercentages: number[] | null;
  /** Taux de réalisation et écarts par zone ; `null` tant qu'aucune activité n'est liée. */
  achievement: SessionAchievementApi | null;
  /** Activité liée (identifiant, origine et date du lien) ; `null` si aucune. */
  activity: SessionActivityLinkApi | null;
}

/** Taux de réalisation (`SessionAchievementResponseDto`) ; les écarts sont signés, en points, pour Z1 à Z5. */
export interface SessionAchievementApi {
  distanceRate: number | null;
  durationRate: number | null;
  zoneGapsPoints: number[] | null;
}

/** Lien à une activité Garmin (`SessionActivityResponseDto`). */
export interface SessionActivityLinkApi {
  id: string;
  origin: 'automatique' | 'manuel';
  linkedAt: string;
}

/** Module envoyé au back : sans position, qui est donnée par l'ordre de la liste. */
export interface SessionModuleRequestApi {
  type: ModuleTypeApi;
  durationMinutes: number;
  instruction: string;
  targetZones: TargetZonesApi | null;
  perceivedEffort: number | null;
}

export interface ReplaceSessionModulesRequestApi {
  modules: SessionModuleRequestApi[];
}

export interface DisciplineApi {
  typeKey: string;
  label: string;
}

export interface DisciplineListResponseApi {
  items: DisciplineApi[];
}
