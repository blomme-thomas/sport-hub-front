import { type Signal, computed, effect, signal } from '@angular/core';

/**
 * Données d'une ressource qui restent affichées pendant un rechargement. Pendant un changement de paramètres, la
 * valeur brute repasse à `undefined` : on garde alors la dernière valeur transformée, jusqu'à l'arrivée de la
 * nouvelle réponse. L'affichage ne se vide donc pas (pas de démontage des cartes, pas de « Chargement » intermédiaire).
 * À appeler dans un contexte d'injection (constructeur ou champ de service).
 */
export function keepLast<R, T>(
  raw: () => R | undefined,
  map: (value: R) => T,
): Signal<T | undefined> {
  const last = signal<T | undefined>(undefined);
  effect(() => {
    const value = raw();
    if (value !== undefined) {
      last.set(map(value));
    }
  });
  return computed(() => {
    const value = raw();
    return value !== undefined ? map(value) : last();
  });
}
