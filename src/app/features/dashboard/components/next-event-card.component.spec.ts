import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../core/http/app-error';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import type { NextEvent } from '../models/next-event.model';
import { NextEventCardComponent } from './next-event-card.component';

const TODAY = '2026-11-07';

const triathlon: NextEvent = {
  id: 'goal-triathlon',
  title: 'Triathlon de Paris',
  targetDate: '2026-11-14',
  formatLabel: 'Olympique',
  targetTimeLabel: '2 h 30 min 0 s',
};

function renderCard(inputs: Partial<Record<string, unknown>>, on?: Record<string, unknown>) {
  return render(NextEventCardComponent, {
    inputs: { event: triathlon, today: TODAY, ...inputs },
    on,
    providers: [provideRouter([])],
  });
}

describe('NextEventCardComponent', () => {
  it('affiche le nombre de jours restants, le titre, le format et le temps cible', async () => {
    await renderCard({});

    expect(
      screen.getByRole('heading', { level: 2, name: 'Prochain événement' }),
    ).toBeInTheDocument();
    expect(screen.getByText('7 jours restants')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Triathlon de Paris' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Olympique')).toBeInTheDocument();
    expect(screen.getByText('2 h 30 min 0 s')).toBeInTheDocument();
  });

  it('affiche Aujourd hui quand l événement a lieu le jour même', async () => {
    await renderCard({ event: { ...triathlon, targetDate: TODAY } });

    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
  });

  it('affiche le singulier quand il reste un seul jour', async () => {
    await renderCard({ event: { ...triathlon, targetDate: '2026-11-08' } });

    expect(screen.getByText('1 jour restant')).toBeInTheDocument();
  });

  it('affiche les libellés de repli quand le format et le temps cible ne sont pas définis', async () => {
    await renderCard({ event: { ...triathlon, formatLabel: null, targetTimeLabel: null } });

    expect(screen.getByText('Format non défini')).toBeInTheDocument();
    expect(screen.getByText('Temps cible non défini')).toBeInTheDocument();
  });

  it('invite à créer un événement sans alerte quand aucun événement n est à venir', async () => {
    await renderCard({ event: null });

    expect(screen.getByText(/Aucun événement à venir/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Créer un événement' })).toHaveAttribute(
      'href',
      '/goals',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('signale le chargement tant que l événement n est pas connu', async () => {
    const { container } = await renderCard({ event: undefined, loading: true });

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('affiche l erreur dans une alerte avec un bouton Réessayer qui émet retry', async () => {
    const retry = vi.fn();
    const error = new AppError({
      code: 'INTERNAL_ERROR',
      status: 500,
      userMessage: ERROR_MESSAGES['INTERNAL_ERROR'],
    });
    await renderCard({ event: undefined, error }, { retry });

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_MESSAGES['INTERNAL_ERROR']);

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
