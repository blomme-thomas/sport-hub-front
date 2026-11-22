import texts from './texts.fr.json';

/**
 * Tous les textes affichés par l'application, dans un seul fichier (`texts.fr.json`).
 * Les composants les exposent avec `protected readonly t = TEXTS;` et les gabarits lisent `t.<zone>.<clé>`.
 */
export const TEXTS = texts;

export type Texts = typeof TEXTS;

/**
 * Remplace les marqueurs `{nom}` d'un texte par les valeurs fournies. Une valeur absente (`null`) s'affiche « — ».
 * Exemple : fill('Fichier chargé : {name}', { name: 'plan.json' }).
 */
export function fill(
  template: string,
  values: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in values)) {
      return match;
    }
    const value = values[key];
    return value === null || value === undefined ? '—' : String(value);
  });
}
