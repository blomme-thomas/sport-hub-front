import { InjectionToken } from '@angular/core';

/**
 * Interrupteur global des fonctionnalités IA du front : conseil du tableau de bord, bilan hebdomadaire et
 * génération de planning. Désactivé tant que le service IA n'est pas prêt : les écrans correspondants ne
 * s'affichent pas, et leurs états ne lancent aucune requête vers les routes IA.
 */
export const AI_FEATURES_ENABLED = false;

/** Lu par les états et les pages IA ; les tests le remplacent par `TestBed` pour activer le parcours. */
export const AI_FEATURES = new InjectionToken<boolean>('AI_FEATURES', {
  providedIn: 'root',
  factory: () => AI_FEATURES_ENABLED,
});
