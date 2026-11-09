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
