import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WeeklyGoalView } from '../../models/weekly-goal.model';
import { WeeklyGoalCardComponent } from './weekly-goal-card.component';

const VIEW: WeeklyGoalView = {
  doneLabel: '6h 42',
  targetLabel: '8h 00',
  percent: 84,
  statusMessage: 'Très bien !',
};

const WITHOUT_TARGET: WeeklyGoalView = {
  doneLabel: '6h 42',
  targetLabel: null,
  percent: null,
  statusMessage: null,
};

describe('WeeklyGoalCardComponent', () => {
  it('affiche la durée réalisée sur la cible, le pourcentage et le statut', async () => {
    await render(WeeklyGoalCardComponent, {
      inputs: { view: VIEW },
      providers: [provideRouter([])],
    });

    expect(screen.getByRole('heading', { name: 'Objectif de la semaine' })).toBeInTheDocument();
    expect(screen.getByText('6h 42 / 8h 00')).toBeInTheDocument();
    expect(screen.getByText('84 %')).toBeInTheDocument();
    expect(screen.getByText('Très bien !')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Objectif atteint à 84 %' })).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Durée réalisée des huit dernières semaines'),
    ).not.toBeInTheDocument();
  });

  it('propose de définir la cible vers les paramètres quand la semaine n’en a pas', async () => {
    await render(WeeklyGoalCardComponent, {
      inputs: { view: WITHOUT_TARGET },
      providers: [provideRouter([])],
    });

    expect(screen.getByRole('link', { name: 'Définir la cible' })).toHaveAttribute(
      'href',
      '/parametres',
    );
    expect(screen.queryByText(/\d %/)).not.toBeInTheDocument();
  });

  it('affiche un état de chargement tant que la vue n’est pas reçue', async () => {
    const { container } = await render(WeeklyGoalCardComponent, {
      inputs: { view: null, loading: true },
      providers: [provideRouter([])],
    });

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(container.querySelector('section')).toHaveAttribute('aria-busy', 'true');
  });

  it('affiche son erreur avec un bouton Réessayer qui émet retry', async () => {
    const retry = vi.fn();
    await render(WeeklyGoalCardComponent, {
      inputs: { view: null, errorMessage: 'Objectif indisponible' },
      on: { retry },
      providers: [provideRouter([])],
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Objectif indisponible');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
