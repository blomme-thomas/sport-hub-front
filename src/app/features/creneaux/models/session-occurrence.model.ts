/** Séance affichée sur le calendrier. `id` est l'identifiant de la séance (ouvre sa fiche). */
export interface SessionOccurrence {
  id: string;
  date: string;
  /** Heure `HH:mm`, toujours renseignée (les séances sans heure ne sont pas placées sur la grille). */
  startTime: string;
  durationMinutes: number;
  disciplineTypeKey: string;
  recurrence: string;
  status: string;
}
