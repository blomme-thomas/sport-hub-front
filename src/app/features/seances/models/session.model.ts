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
  disciplineLabel: string;
  durationMinutes: number;
  startTime: string | null;
  status: SessionStatus;
  modifiedManually: boolean;
  description: string | null;
  equipment: string | null;
  attentionPoints: string | null;
  modules: SessionModule[];
}

/** Module en cours d'édition, identifié par une clé locale stable (le rang ne l'est pas). */
export interface EditableModule extends Omit<SessionModule, 'position'> {
  key: number;
}
