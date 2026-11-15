import type { DisciplineStyle } from '../../../shared/ui/discipline/discipline-style';

/** Séance planifiée affichée dans le mini-calendrier. `startTime` est `null` si la séance n'a pas d'heure. */
export interface WeekMiniSession {
  id: string;
  date: string;
  startTime: string | null;
  disciplineTypeKey: string;
}

/** Activité réalisée affichée dans le mini-calendrier, en lecture seule. */
export interface WeekMiniActivity {
  id: string;
  /** Libellé accessible : « Course à pied, 45 min ». */
  label: string;
  discipline: DisciplineStyle;
}

/** Libellé d'une discipline présente sur la semaine, pour la légende. */
export interface WeekMiniLegendEntry {
  typeKey: string;
  label: string;
}
