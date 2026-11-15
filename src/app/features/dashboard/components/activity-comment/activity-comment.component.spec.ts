import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { activityCommentApi } from '../../../../../mocks/fixtures/activity-comment.fixtures';
import { toActivityComment } from '../../data-access/activity-comment.mapper';
import { ActivityCommentComponent } from './activity-comment.component';

const comment = toActivityComment(activityCommentApi);

describe('ActivityCommentComponent', () => {
  it('affiche le commentaire et sa source', async () => {
    await render(ActivityCommentComponent, { inputs: { comment } });

    expect(screen.getByText(activityCommentApi.text)).toBeInTheDocument();
    expect(screen.getByText(/Généré par l’IA/)).toBeInTheDocument();
  });

  it('signale un commentaire générique', async () => {
    await render(ActivityCommentComponent, {
      inputs: { comment: { ...comment, generic: true, model: null } },
    });

    expect(screen.getByText(/Commentaire générique/)).toBeInTheDocument();
  });

  it('propose de générer quand l’activité n’a pas de commentaire', async () => {
    const user = userEvent.setup();
    const generate = vi.fn();
    await render(ActivityCommentComponent, { inputs: { comment: null }, on: { generate } });

    await user.click(screen.getByRole('button', { name: 'Générer le commentaire' }));

    expect(generate).toHaveBeenCalledOnce();
  });

  it('demande une confirmation avant de régénérer', async () => {
    const user = userEvent.setup();
    const regenerate = vi.fn();
    await render(ActivityCommentComponent, { inputs: { comment }, on: { regenerate } });

    await user.click(screen.getByRole('button', { name: 'Régénérer' }));
    expect(regenerate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirmer la régénération' }));
    expect(regenerate).toHaveBeenCalledOnce();
  });

  it('annule la régénération sans rien émettre', async () => {
    const user = userEvent.setup();
    const regenerate = vi.fn();
    await render(ActivityCommentComponent, { inputs: { comment }, on: { regenerate } });

    await user.click(screen.getByRole('button', { name: 'Régénérer' }));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(regenerate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Régénérer' })).toBeInTheDocument();
  });

  it('affiche l’erreur avec un bouton pour réessayer', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    await render(ActivityCommentComponent, {
      inputs: { comment: null, errorMessage: 'Le service est indisponible.' },
      on: { retry },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Le service est indisponible.');
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
