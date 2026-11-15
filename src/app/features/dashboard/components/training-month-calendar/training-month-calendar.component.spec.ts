import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { disciplineStyleOf } from '../../../../shared/ui/discipline/discipline-style';
import type { MonthDay } from '../../models/training-month.model';
import { TrainingMonthCalendarComponent } from './training-month-calendar.component';

function day(overrides: Partial<MonthDay> & Pick<MonthDay, 'date' | 'dayOfMonth'>): MonthDay {
  return {
    inMonth: true,
    isToday: false,
    activities: [],
    label: String(overrides.dayOfMonth),
    ...overrides,
  };
}

const runDay = day({
  date: '2026-11-08',
  dayOfMonth: 8,
  label: '8 novembre, Course à pied, 45 min',
  activities: [
    {
      id: 'a',
      typeLabel: 'Course à pied',
      durationLabel: '45 min',
      discipline: disciplineStyleOf('running'),
    },
  ],
});

const weeks: MonthDay[][] = [[day({ date: '2026-11-02', dayOfMonth: 2 }), runDay]];

describe('TrainingMonthCalendarComponent', () => {
  it('expose en bouton un jour avec séances, avec son libellé complet', async () => {
    await render(TrainingMonthCalendarComponent, {
      inputs: { title: 'Novembre 2026', weeks },
    });

    expect(
      screen.getByRole('button', { name: '8 novembre, Course à pied, 45 min' }),
    ).toBeInTheDocument();
  });

  it('n’expose pas un jour sans séance comme bouton', async () => {
    await render(TrainingMonthCalendarComponent, {
      inputs: { title: 'Novembre 2026', weeks },
    });

    expect(screen.getAllByRole('button', { name: /novembre/ })).toHaveLength(1);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('sélectionne le jour au clic', async () => {
    const user = userEvent.setup();
    await render(TrainingMonthCalendarComponent, {
      inputs: { title: 'Novembre 2026', weeks },
    });

    const button = screen.getByRole('button', { name: '8 novembre, Course à pied, 45 min' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('émet les demandes de navigation par mois', async () => {
    const user = userEvent.setup();
    const previous = vi.fn();
    const next = vi.fn();
    const current = vi.fn();
    await render(TrainingMonthCalendarComponent, {
      inputs: { title: 'Novembre 2026', weeks },
      on: { previous, next, current },
    });

    await user.click(screen.getByRole('button', { name: 'Mois précédent' }));
    await user.click(screen.getByRole('button', { name: 'Mois suivant' }));
    await user.click(screen.getByRole('button', { name: 'Ce mois' }));

    expect(previous).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(current).toHaveBeenCalledOnce();
  });

  it('affiche l’erreur avec un bouton pour réessayer', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    await render(TrainingMonthCalendarComponent, {
      inputs: { title: 'Novembre 2026', weeks: [], error: 'Le service est indisponible.' },
      on: { retry },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Le service est indisponible.');
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('indique qu’il n’y a aucune activité ce mois-ci', async () => {
    await render(TrainingMonthCalendarComponent, {
      inputs: { title: 'Novembre 2026', weeks: [], empty: true },
    });

    expect(screen.getByText('Aucune activité ce mois-ci.')).toBeInTheDocument();
  });
});
