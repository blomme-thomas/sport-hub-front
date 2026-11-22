import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Point d'entrée unique du rendu markdown : markdown → HTML (marked) → nettoyage (DOMPurify).
 * Tout contenu markdown affiché ou prévisualisé passe par ici : le HTML produit n'est jamais injecté brut.
 */
export function renderMarkdown(text: string): string {
  const html = marked.parse(text, { async: false, gfm: true, breaks: true });
  return DOMPurify.sanitize(html);
}
