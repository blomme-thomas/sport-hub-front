/** Séance planifiée affichée dans le mini-calendrier. `startTime` est `null` si la séance n'a pas d'heure. */
export interface WeekMiniSession {
  id: string;
  date: string;
  startTime: string | null;
  disciplineTypeKey: string;
}

/** Libellé d'une discipline présente sur la semaine, pour la légende. */
export interface WeekMiniLegendEntry {
  typeKey: string;
  label: string;
}
