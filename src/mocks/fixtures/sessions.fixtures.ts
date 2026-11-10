import type {
  DisciplineApi,
  SessionApi,
  SessionModuleApi,
} from '../../app/features/seances/models/session.api-model';

export const SESSION_ID = 'session-course';
export const SESSION_DONE_ID = 'session-realisee';

export const echauffementApi: SessionModuleApi = {
  position: 1,
  type: 'echauffement',
  durationMinutes: 10,
  instruction: 'Footing souple',
  targetZones: null,
  perceivedEffort: null,
};

export const seriesApi: SessionModuleApi = {
  position: 2,
  type: 'series',
  durationMinutes: 25,
  instruction: '4 x 400 m',
  targetZones: { heartRate: { min: 160, max: 170 } },
  perceivedEffort: 7,
};

export const retourApi: SessionModuleApi = {
  position: 3,
  type: 'retour_au_calme',
  durationMinutes: 10,
  instruction: 'Footing lent',
  targetZones: null,
  perceivedEffort: null,
};

export const sessionApi: SessionApi = {
  id: SESSION_ID,
  date: '2026-11-12',
  disciplineTypeKey: 'course_a_pied',
  durationMinutes: 45,
  startTime: '18:00',
  status: 'planifiee',
  modifiedManually: false,
  description: null,
  equipment: 'Montre GPS',
  attentionPoints: 'Hydratation',
  modules: [echauffementApi, seriesApi, retourApi],
  changeLog: [],
  targetDistanceMeters: 10000,
  targetHrZonePercentages: [10, 20, 40, 20, 10],
  achievement: null,
  activity: null,
};

export const completedSessionApi: SessionApi = {
  ...sessionApi,
  achievement: { distanceRate: 120, durationRate: 83.3, zoneGapsPoints: [0, -5, 10, 0, -5] },
  activity: { id: 'activity-1', origin: 'automatique', linkedAt: '2026-11-12T18:00:00.000Z' },
  id: SESSION_DONE_ID,
  status: 'realisee',
  modules: [seriesApi],
};

export const disciplinesFixtures: DisciplineApi[] = [
  { typeKey: 'course_a_pied', label: 'Course à pied' },
  { typeKey: 'velo', label: 'Vélo' },
];
