import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { NzMessageService } from 'ng-zorro-antd/message';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { goalsListResponse } from '../../../../mocks/fixtures/goals.fixtures';
import {
  GOALS_URL,
  goalsTestProviders,
  problemResponse,
  trackGoalsList,
} from '../../../../mocks/goals.testing';
import { server } from '../../../../mocks/server';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import type { GoalApi } from '../models/goal.api-model';
import { GoalsPage } from './goals.page';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-07T10:00:00Z') });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GoalsPage', () => {
  it('affiche le titre de la page Objectifs', async () => {
    trackGoalsList();

    await render(GoalsPage, { providers: goalsTestProviders() });

    expect(screen.getByRole('heading', { level: 1, name: 'Objectifs' })).toBeInTheDocument();
  });

  it('affiche les sections À venir, Passés et Sans date même sans objectif', async () => {
    trackGoalsList(() => HttpResponse.json({ items: [] }));

    await render(GoalsPage, { providers: goalsTestProviders() });

    expect(await screen.findByRole('region', { name: 'À venir' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Passés' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Sans date' })).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('range chaque objectif dans la section correspondant à sa date', async () => {
    trackGoalsList();

    await render(GoalsPage, { providers: goalsTestProviders() });

    const upcoming = await screen.findByRole('region', { name: 'À venir' });
    expect(await within(upcoming).findByText('Triathlon de Paris')).toBeInTheDocument();
    expect(within(upcoming).getByText('Course du jour')).toBeInTheDocument();
    expect(within(upcoming).queryByText('Semi-marathon de Lyon')).not.toBeInTheDocument();

    const past = screen.getByRole('region', { name: 'Passés' });
    expect(within(past).getByText('Semi-marathon de Lyon')).toBeInTheDocument();

    const undated = screen.getByRole('region', { name: 'Sans date' });
    expect(within(undated).getByText('Volume hebdomadaire')).toBeInTheDocument();
  });

  it('signale le chargement tant que la liste n est pas reçue', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    trackGoalsList(async () => {
      await gate;
      return HttpResponse.json(goalsListResponse);
    });

    const { container } = await render(GoalsPage, { providers: goalsTestProviders() });

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();

    release();

    await waitFor(() => {
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });
  });

  it('affiche une erreur avec un bouton Réessayer qui relance le chargement', async () => {
    let calls = 0;
    trackGoalsList(() => {
      calls += 1;
      return calls === 1
        ? problemResponse(500, 'INTERNAL_ERROR')
        : HttpResponse.json(goalsListResponse);
    });
    await render(GoalsPage, { providers: goalsTestProviders() });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(ERROR_MESSAGES['INTERNAL_ERROR']);

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByText('Triathlon de Paris')).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it('ouvre un formulaire vierge depuis le bouton Nouvel objectif', async () => {
    trackGoalsList();
    await render(GoalsPage, { providers: goalsTestProviders() });
    await screen.findByText('Triathlon de Paris');

    await userEvent.click(screen.getByRole('button', { name: 'Nouvel objectif' }));

    expect(await screen.findByRole('textbox', { name: 'Titre' })).toHaveDisplayValue('');
  });

  it('ouvre le formulaire pré-rempli depuis le bouton Modifier de l objectif', async () => {
    trackGoalsList();
    await render(GoalsPage, { providers: goalsTestProviders() });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Modifier Triathlon de Paris' }),
    );

    expect(await screen.findByRole('textbox', { name: 'Titre' })).toHaveDisplayValue(
      'Triathlon de Paris',
    );
  });

  it('ne supprime rien quand l utilisateur annule la confirmation', async () => {
    trackGoalsList();
    const deletedIds: string[] = [];
    server.use(
      http.delete(`${GOALS_URL}/:id`, ({ params }) => {
        deletedIds.push(String(params['id']));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await render(GoalsPage, { providers: goalsTestProviders() });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Supprimer Triathlon de Paris' }),
    );
    await screen.findByText('Supprimer cet objectif ?');
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    await waitFor(() => {
      expect(screen.queryByText('Supprimer cet objectif ?')).not.toBeInTheDocument();
    });
    expect(deletedIds).toEqual([]);
    expect(screen.getByText('Triathlon de Paris')).toBeInTheDocument();
  });

  it('supprime l objectif après confirmation puis le retire de la liste', async () => {
    let items: GoalApi[] = [...goalsListResponse.items];
    trackGoalsList(() => HttpResponse.json({ items }));
    const deletedIds: string[] = [];
    server.use(
      http.delete(`${GOALS_URL}/:id`, ({ params }) => {
        const id = String(params['id']);
        deletedIds.push(id);
        items = items.filter((item) => item.id !== id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await render(GoalsPage, { providers: goalsTestProviders() });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Supprimer Triathlon de Paris' }),
    );
    await screen.findByText('Supprimer cet objectif ?');
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => {
      expect(screen.queryByText('Triathlon de Paris')).not.toBeInTheDocument();
    });
    expect(deletedIds).toEqual(['goal-triathlon']);
  });

  it('confirme la suppression par un message de succès', async () => {
    trackGoalsList();
    server.use(http.delete(`${GOALS_URL}/:id`, () => new HttpResponse(null, { status: 204 })));
    await render(GoalsPage, { providers: goalsTestProviders() });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Supprimer Triathlon de Paris' }),
    );
    await screen.findByText('Supprimer cet objectif ?');
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => {
      expect(TestBed.inject(NzMessageService).success).toHaveBeenCalled();
    });
  });

  it('affiche le message d erreur et garde l objectif quand la suppression échoue', async () => {
    trackGoalsList();
    server.use(http.delete(`${GOALS_URL}/:id`, () => problemResponse(404, 'GOAL_NOT_FOUND')));
    await render(GoalsPage, { providers: goalsTestProviders() });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Supprimer Triathlon de Paris' }),
    );
    await screen.findByText('Supprimer cet objectif ?');
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => {
      expect(TestBed.inject(NzMessageService).error).toHaveBeenCalledWith(
        ERROR_MESSAGES['GOAL_NOT_FOUND'],
      );
    });
    expect(screen.getByText('Triathlon de Paris')).toBeInTheDocument();
  });
});
