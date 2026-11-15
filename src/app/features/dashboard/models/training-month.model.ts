import type { DisciplineStyle } from '../../../shared/ui/discipline/discipline-style';

/** Activité réalisée affichée sur une case du calendrier mensuel. */
export interface MonthActivity {
  id: string;
  typeLabel: string;
  durationLabel: string;
  discipline: DisciplineStyle;
}

/** Case du calendrier mensuel : grille lundi → dimanche, avec les jours des mois voisins grisés. */
export interface MonthDay {
  /** Date locale `YYYY-MM-DD`. */
  date: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  activities: readonly MonthActivity[];
  /** Libellé accessible : « 8 novembre, Course à pied, 45 min ». */
  label: string;
}
