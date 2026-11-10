import type { TargetZonesApi } from './session.api-model';

export type SessionStatus = 'planifiee' | 'realisee' | 'manquee';

export type ModuleType = 'echauffement' | 'educatifs' | 'series' | 'retour_au_calme' | 'autre';

/** Zones cibles, reprises telles quelles : la fiche les affiche sans les modifier. */
export type TargetZones = TargetZonesApi;

export interface SessionModule {
  position: number;
  type: ModuleType;
  durationMinutes: number;
  instruction: string;
  targetZones: TargetZones | null;
  perceivedEffort: number | null;
}

/** Séance détaillée. `disciplineLabel` vaut la clé si le référentiel ne la connaît pas. */
export interface Session {
  id: string;
  date: string;
  /** Clé Garmin de la discipline, comparée au type des activités associables. */
  disciplineTypeKey: string;
  disciplineLabel: string;
  durationMinutes: number;
  startTime: string | null;
  status: SessionStatus;
  modifiedManually: boolean;
  description: string | null;
  equipment: string | null;
  attentionPoints: string | null;
  modules: SessionModule[];
  objectives: SessionObjectives;
  achievement: SessionAchievement | null;
  linkedActivity: LinkedActivity | null;
}

/** Objectifs saisis à la création : distance cible et répartition cible par zone (Z1 à Z5, en %). */
export interface SessionObjectives {
  distanceMeters: number | null;
  zonePercentages: number[] | null;
}

/** Réalisation : taux distance et durée (bruts, à plafonner à l'affichage) et écarts par zone en points. */
export interface SessionAchievement {
  distanceRate: number | null;
  durationRate: number | null;
  zoneGapsPoints: number[] | null;
}

/** Activité liée à la séance, identifiée par son id ; le détail se lit à part. */
export interface LinkedActivity {
  id: string;
  origin: 'automatique' | 'manuel';
  linkedAt: string;
}

/** Module en cours d'édition, identifié par une clé locale stable (le rang ne l'est pas). */
export interface EditableModule extends Omit<SessionModule, 'position'> {
  key: number;
}
