/** Séance récente, prête à l'affichage (libellés déjà formatés). */
export interface RecentActivity {
  id: string;
  typeLabel: string;
  /** Pictogramme du sport, décoratif (le libellé porte l'information). */
  typeIcon: string;
  /** Libellé relatif : « Aujourd'hui », « Hier », « Samedi » ou « 12 mars ». */
  dateLabel: string;
  durationLabel: string;
  /** « — » si Garmin ne fournit pas la distance. */
  distanceLabel: string;
  /** Fréquence cardiaque moyenne, « — » si absente. */
  heartRateLabel: string;
}
