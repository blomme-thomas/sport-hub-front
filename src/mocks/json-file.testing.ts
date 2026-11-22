import { fireEvent, screen, waitFor, within } from '@testing-library/angular';
import { expect } from 'vitest';

/** Zone de dépôt d'un fichier JSON, repérée par son libellé (`role="group"`). */
export function jsonFileDropZone(label: string): HTMLElement {
  return screen.getByRole('group', { name: label });
}

/**
 * Dépose un fichier `.json` contenant `content` dans la zone, puis attend que le composant ait pris le fichier
 * (son nom s'affiche, et le contenu est émis au parent dans la foulée).
 */
export async function dropJsonFile(
  zone: HTMLElement,
  content: string,
  name = 'plan.json',
): Promise<void> {
  const file = new File([content], name, { type: 'application/json' });
  const files = Object.assign([file], { item: (index: number) => (index === 0 ? file : null) });
  fireEvent.drop(zone, { dataTransfer: { files } });
  await waitFor(() =>
    expect(within(zone).getByText(`Fichier chargé : ${name}`)).toBeInTheDocument(),
  );
}
