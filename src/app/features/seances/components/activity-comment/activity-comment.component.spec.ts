import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityCommentApi } from '../../models/activity-comment.api-model';
import { ActivityCommentComponent } from './activity-comment.component';

const COMMENT: ActivityCommentApi = {
  activityId: 'activity-1',
  text: '**Bien** tenu, allure régulière.',
  source: 'saisie-manuelle',
  model: null,
  generatedAt: '2026-11-12T18:00:00.000Z',
};

describe('ActivityCommentComponent', () => {
  it('affiche le commentaire rendu en markdown, sa source et sa date', async () => {
    await render(ActivityCommentComponent, { inputs: { comment: COMMENT } });

    expect(screen.getByText('Saisi à la main · 12/11/2026 18:00')).toBeInTheDocument();
    expect(screen.getByText('Bien', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('propose d’ajouter un commentaire quand il n’en existe pas', async () => {
    const edit = vi.fn();
    await render(ActivityCommentComponent, { inputs: { comment: null }, on: { edit } });

    expect(screen.getByText('Aucun commentaire pour cette activité.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un commentaire' }));

    expect(edit).toHaveBeenCalledOnce();
  });

  it('affiche un aperçu markdown pendant la saisie et émet les modifications', async () => {
    const draftChange = vi.fn();
    await render(ActivityCommentComponent, {
      inputs: { comment: null, editing: true, draft: '# Titre', canSave: true },
      on: { draftChange },
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Titre' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Texte (markdown)'), '!');

    expect(draftChange).toHaveBeenCalled();
  });

  it('désactive l’enregistrement tant que le texte est vide', async () => {
    await render(ActivityCommentComponent, {
      inputs: { comment: null, editing: true, draft: '  ', canSave: false },
    });

    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  });

  it('émet l’enregistrement et l’annulation', async () => {
    const save = vi.fn();
    const cancel = vi.fn();
    await render(ActivityCommentComponent, {
      inputs: { comment: null, editing: true, draft: 'Texte', canSave: true },
      on: { save, cancelEdit: cancel },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(save).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('affiche l’erreur d’enregistrement sans effacer le brouillon', async () => {
    await render(ActivityCommentComponent, {
      inputs: {
        comment: null,
        editing: true,
        draft: 'Mon texte',
        canSave: true,
        saveError: { userMessage: 'Enregistrement impossible.' } as never,
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Enregistrement impossible.');
    expect(screen.getByLabelText('Texte (markdown)')).toHaveValue('Mon texte');
  });
});
