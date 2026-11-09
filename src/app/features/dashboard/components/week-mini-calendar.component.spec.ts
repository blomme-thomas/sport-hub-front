import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../core/http/app-error';
import type { WeekMiniDay } from '../data-access/week-mini-calendar.state';
import { WeekMiniCalendarComponent } from './week-mini-calendar.component';

const MONDAY = '2026-11-09';
const WEDNESDAY = '2026-11-11';

function days(sessionsByDate: Record<string, WeekMiniDay['sessions']>): WeekMiniDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.parse(`${MONDAY}T00:00:00Z`) + index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return { date, sessions: sessionsByDate[date] ?? [] };
  });
}

const course = {
  id: 'session-course',
  date: WEDNESDAY,
  startTime: '18:00',
  disciplineTypeKey: 'running',
};
const velo = { id: 'session-velo', date: MONDAY, startTime: '07:00', disciplineTypeKey: 'cycling' };
const inconnue = { id: 'session-golf', date: MONDAY, startTime: null, disciplineTypeKey: 'golf' };

const legend = [
  { typeKey: 'running', label: 'Course à pied' },
  { typeKey: 'cycling', label: 'Vélo' },
];

describe('WeekMiniCalendarComponent', () => {
  it('affiche une icône par séance dans la case de son jour', async () => {
    await render(WeekMiniCalendarComponent, {
      inputs: { days: days({ [WEDNESDAY]: [course], [MONDAY]: [velo] }), legend },
      on: {
        previous: vi.fn(),
        next: vi.fn(),
        current: vi.fn(),
        retry: vi.fn(),
        sessionSelected: vi.fn(),
      },
    });

    const grid = screen.getByRole('list', { name: 'Séances de la semaine' });
    const items = grid.querySelectorAll(':scope > li');
    expect(items).toHaveLength(7);
    expect(items[0]?.querySelector('button')?.getAttribute('aria-label')).toBe(
      'Séance Vélo, 07:00. Ouvrir la séance',
    );
    expect(items[2]?.querySelector('button')?.getAttribute('aria-label')).toBe(
      'Séance Course à pied, 18:00. Ouvrir la séance',
    );
  });

  it('émet l’identifiant de la séance au clic', async () => {
    const sessionSelected = vi.fn();
    await render(WeekMiniCalendarComponent, {
      inputs: { days: days({ [WEDNESDAY]: [course] }), legend },
      on: { previous: vi.fn(), next: vi.fn(), current: vi.fn(), retry: vi.fn(), sessionSelected },
    });

    await userEvent.click(screen.getByRole('button', { name: /Course à pied, 18:00/ }));

    expect(sessionSelected).toHaveBeenCalledWith('session-course');
  });

  it('affiche une discipline inconnue en neutre, avec sa clé comme libellé, sans erreur', async () => {
    await render(WeekMiniCalendarComponent, {
      inputs: {
        days: days({ [MONDAY]: [inconnue] }),
        legend: [{ typeKey: 'golf', label: 'golf' }],
      },
      on: {
        previous: vi.fn(),
        next: vi.fn(),
        current: vi.fn(),
        retry: vi.fn(),
        sessionSelected: vi.fn(),
      },
    });

    expect(
      screen.getByRole('button', { name: 'Séance golf, sans heure. Ouvrir la séance' }),
    ).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('affiche le message vide quand aucune séance n’est planifiée', async () => {
    await render(WeekMiniCalendarComponent, {
      inputs: { days: days({}), legend: [], empty: true },
      on: {
        previous: vi.fn(),
        next: vi.fn(),
        current: vi.fn(),
        retry: vi.fn(),
        sessionSelected: vi.fn(),
      },
    });

    expect(screen.getByText('Aucune séance planifiée cette semaine.')).toBeTruthy();
  });

  it('affiche l’erreur avec un bouton Réessayer qui émet retry', async () => {
    const retry = vi.fn();
    await render(WeekMiniCalendarComponent, {
      inputs: {
        days: days({}),
        legend: [],
        error: new AppError({ code: 'NETWORK', status: 0, userMessage: 'Connexion impossible.' }),
      },
      on: { previous: vi.fn(), next: vi.fn(), current: vi.fn(), retry, sessionSelected: vi.fn() },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Connexion impossible.');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalled();
  });
});
