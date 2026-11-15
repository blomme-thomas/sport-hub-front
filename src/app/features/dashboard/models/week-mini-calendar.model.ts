import type { DisciplineStyle } from '../../../shared/ui/discipline/discipline-style';

/** Séance planifiée affichée dans le mini-calendrier. `startTime` est `null` si la séance n'a pas d'heure. */
export interface WeekMiniSession {
  id: string;
  date: string;
  startTime: string | null;
  disciplineTypeKey: string;
  /** Libellé du référentiel pour le type de la séance, renseigné par l'état. */
  disciplineLabel?: string;
}

/** Discipline du référentiel : libellé et famille de sport (course, vélo, natation, autre). */
export interface WeekMiniDiscipline {
  label: string;
  family: string;
}

/** Libellés des familles affichés dans la légende. */
export const FAMILY_LABELS: Readonly<Record<string, string>> = {
  running: 'Course à pied',
  cycling: 'Vélo',
  swimming: 'Natation',
  other: 'Autres',
};

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
