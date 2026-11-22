/**
 * Déclenche le téléchargement d'un fichier reçu du back, sans transformation.
 * L'URL temporaire est libérée juste après le clic.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
