/** Famille de sport de la répartition : course, cyclisme, natation, autres. */
export type SportFamily = 'running' | 'cycling' | 'swimming' | 'other';

/** Part d'un sport dans la période, prête à l'affichage. */
export interface SportShare {
  family: SportFamily;
  label: string;
  /** Pourcentage entier ; la somme des parts vaut 100. */
  percent: number;
  /** Token de couleur de la maquette (course bleu, cyclisme vert, natation orange, autres violet). */
  colorVariable: string;
}

/** Répartition par sport de la dernière période. `shares` est vide si aucune durée n'est enregistrée. */
export interface SportSplitView {
  shares: SportShare[];
  totalLabel: string;
}
