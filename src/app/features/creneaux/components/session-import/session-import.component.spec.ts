import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../../core/http/app-error';
import { dropJsonFile, jsonFileDropZone } from '../../../../../mocks/json-file.testing';
import { SessionImportComponent } from './session-import.component';

const IMPORT_FILE = JSON.stringify({
  kind: 'plan-seances',
  schemaVersion: 1,
  importId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  seances: [{ date: '2026-11-20' }, { date: '2026-11-21' }],
});

const ZONE = 'Fichier de séances (.json)';

async function renderImport(serverError: AppError | null = null, submitting = false) {
  const saved = vi.fn();
  const cancelled = vi.fn();
  await render(SessionImportComponent, {
    inputs: { serverError, submitting },
    on: { saved, cancelled },
  });
  return { saved, cancelled };
}

describe('SessionImportComponent', () => {
  it('compte les séances d’un fichier déposé et active l’import', async () => {
    await renderImport();

    await dropJsonFile(jsonFileDropZone(ZONE), IMPORT_FILE);

    expect(await screen.findByText('2 séance(s) détectée(s) dans le fichier.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importer les séances' })).toBeEnabled();
  });

  it('signale un JSON mal formé et bloque l’import', async () => {
    const { saved } = await renderImport();

    await dropJsonFile(jsonFileDropZone(ZONE), '{ "seances": ');

    expect(await screen.findByRole('alert')).toHaveTextContent('Le fichier n’est pas utilisable');
    expect(screen.getByRole('button', { name: 'Importer les séances' })).toBeDisabled();
    expect(saved).not.toHaveBeenCalled();
  });

  it('émet le contenu JSON tel quel au clic sur Importer', async () => {
    const user = userEvent.setup();
    const { saved } = await renderImport();

    await dropJsonFile(jsonFileDropZone(ZONE), IMPORT_FILE);
    await screen.findByText('2 séance(s) détectée(s) dans le fichier.');
    await user.click(screen.getByRole('button', { name: 'Importer les séances' }));

    expect(saved).toHaveBeenCalledWith(JSON.parse(IMPORT_FILE));
  });

  it('affiche chaque erreur renvoyée par le back avec son chemin', async () => {
    const serverError = new AppError({
      code: 'SESSION_IMPORT_INVALID',
      status: 400,
      userMessage: 'Le fichier contient des erreurs : aucune séance n’a été créée.',
      fieldErrors: [
        {
          field: 'seances[2].modules[1].durationMinutes',
          message: 'doit être un entier',
        },
      ],
    });
    await renderImport(serverError);

    await dropJsonFile(jsonFileDropZone(ZONE), IMPORT_FILE);

    expect(screen.getByText('seances[2].modules[1].durationMinutes')).toBeInTheDocument();
    expect(screen.getByText(/doit être un entier/)).toBeInTheDocument();
  });

  it('émet l’annulation depuis le bouton Annuler', async () => {
    const user = userEvent.setup();
    const { cancelled } = await renderImport();

    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(cancelled).toHaveBeenCalled();
  });
});
