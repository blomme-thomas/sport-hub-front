import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../../core/http/app-error';
import { dropJsonFile, jsonFileDropZone } from '../../../../../mocks/json-file.testing';
import { PlanImportComponent } from './plan-import.component';

const FOODS_FILE = JSON.stringify({
  kind: 'plan-aliments',
  schemaVersion: 1,
  aliments: [{ name: 'Riz' }, { name: 'Poulet' }],
});

const ZONE = 'Fichier (.json)';

async function renderImport(
  kind: 'aliments' | 'recettes' = 'aliments',
  serverError: AppError | null = null,
) {
  const saved = vi.fn();
  const cancelled = vi.fn();
  await render(PlanImportComponent, {
    inputs: { kind, serverError, submitting: false },
    on: { saved, cancelled },
  });
  return { saved, cancelled };
}

describe('PlanImportComponent', () => {
  it('compte les aliments d’un fichier déposé et active l’import', async () => {
    await renderImport();

    await dropJsonFile(jsonFileDropZone(ZONE), FOODS_FILE);

    expect(await screen.findByText('2 élément(s) détecté(s) dans le fichier.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importer' })).toBeEnabled();
  });

  it('nomme le format attendu selon le type d’import', async () => {
    await renderImport('recettes');

    expect(screen.getByText('plan-recettes')).toBeInTheDocument();
  });

  it('signale un fichier qui ne contient pas la liste attendue et bloque l’import', async () => {
    const { saved } = await renderImport('recettes');

    await dropJsonFile(jsonFileDropZone(ZONE), FOODS_FILE);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'la liste « recettes » est absente du fichier',
    );
    expect(screen.getByRole('button', { name: 'Importer' })).toBeDisabled();
    expect(saved).not.toHaveBeenCalled();
  });

  it('émet le contenu JSON tel quel au clic sur Importer', async () => {
    const user = userEvent.setup();
    const { saved } = await renderImport();

    await dropJsonFile(jsonFileDropZone(ZONE), FOODS_FILE);
    await screen.findByText('2 élément(s) détecté(s) dans le fichier.');
    await user.click(screen.getByRole('button', { name: 'Importer' }));

    expect(saved).toHaveBeenCalledWith(JSON.parse(FOODS_FILE));
  });

  it('affiche chaque erreur renvoyée par le back avec son chemin', async () => {
    const serverError = new AppError({
      code: 'FOOD_IMPORT_INVALID',
      status: 400,
      userMessage: 'Le fichier contient des erreurs : aucun aliment n’a été créé.',
      fieldErrors: [{ field: 'aliments[1].categories', message: 'catégorie inconnue' }],
    });
    await renderImport('aliments', serverError);

    await dropJsonFile(jsonFileDropZone(ZONE), FOODS_FILE);

    expect(screen.getByText('aliments[1].categories')).toBeInTheDocument();
    expect(screen.getByText(/catégorie inconnue/)).toBeInTheDocument();
  });

  it('émet l’annulation depuis le bouton Annuler', async () => {
    const user = userEvent.setup();
    const { cancelled } = await renderImport();

    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(cancelled).toHaveBeenCalled();
  });
});
