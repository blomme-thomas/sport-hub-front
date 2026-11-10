/** Une zone cardiaque (Z1 à Z5) de la carte Zones d'entraînement, prête à l'affichage. */
export interface ZoneShareView {
  /** Libellé court, « Z1 » à « Z5 ». */
  label: string;
  /** Nom de la zone (Récupération, Endurance, Tempo, Seuil, Puissance). */
  name: string;
  /** Pourcentage entier du temps passé dans la zone sur la période. */
  percent: number;
  /** Token de couleur de la zone : Z1 gris, Z2 vert, Z3 orange, Z4 rouge, Z5 violet. */
  colorVariable: string;
}

/**
 * Vue de la carte Zones. `zones` est vide sans donnée de zone sur la période ; dans ce cas `optimalPercent`
 * et `statusMessage` valent `null` et la carte affiche un état vide, sans valeur fictive.
 */
export interface ZonesCardView {
  zones: ZoneShareView[];
  /** Part du temps en zone optimale, en pourcentage entier ; `null` sans donnée. */
  optimalPercent: number | null;
  /** Message de statut dérivé de `optimalPercent` ; `null` sans donnée. */
  statusMessage: string | null;
}
