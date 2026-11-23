import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../../core/http/app-error';
import type { WeekMiniDay } from '../../data-access/week-mini-calendar.state';
import { WeekMiniCalendarComponent } from './week-mini-calendar.component';

const MONDAY = '2026-11-09';
const WEDNESDAY = '2026-11-11';

function days(sessionsByDate: Record<string, WeekMiniDay['sessions']>): WeekMiniDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.parse(`${MONDAY}T00:00:00Z`) + index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return { date, sessions: sessionsByDate[date] ?? [], realized: [], inPeriod: true };
  });
}

/** Numéro du jour de la case qui contient l'élément (vue mois). */
function dayNumberOf(element: HTMLElement): string | null {
  return (
    element.closest('li.week-mini__day')?.querySelector('.week-mini__day-label')?.textContent ??
    null
  );
}

/** Ajoute une activité réalisée au jour `date` de la liste. */
function withRealized(list: WeekMiniDay[], date: string): WeekMiniDay[] {
  return list.map((day) =>
    day.date === date
      ? {
          ...day,
          realized: [
            {
              id: 'act-run',
              label: 'Course à pied, 45 min',
              startTime: '09:00',
              discipline: { icon: 'run', color: 'var(--sh-success)' },
            },
          ],
        }
      : day,
  );
}

const course = {
  id: 'session-course',
  date: WEDNESDAY,
  startTime: '18:00',
  disciplineTypeKey: 'running',
};
const velo = { id: 'session-velo', date: MONDAY, startTime: '07:00', disciplineTypeKey: 'cycling' };
const inconnue = {
  id: 'session-golf',
  date: MONDAY,
  startTime: '10:00',
  disciplineTypeKey: 'golf',
};

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

    const veloButton = screen.getByRole('button', { name: 'Séance Vélo, 07:00. Ouvrir la séance' });
    const courseButton = screen.getByRole('button', {
      name: 'Séance Course à pied, 18:00. Ouvrir la séance',
    });
    // Chaque séance est dans la case de son jour : le vélo le lundi 9, la course le mercredi 11.
    expect(dayNumberOf(veloButton)).toBe('9');
    expect(dayNumberOf(courseButton)).toBe('11');
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
      screen.getByRole('button', { name: 'Séance golf, 10:00. Ouvrir la séance' }),
    ).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
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

describe('WeekMiniCalendarComponent — activités réalisées', () => {
  it('affiche une activité réalisée comme repère non interactif, avec son libellé', async () => {
    await render(WeekMiniCalendarComponent, {
      inputs: { days: withRealized(days({}), WEDNESDAY), legend: [] },
      on: {
        previous: vi.fn(),
        next: vi.fn(),
        current: vi.fn(),
        retry: vi.fn(),
        sessionSelected: vi.fn(),
      },
    });

    const marker = screen.getByRole('img', { name: 'Réalisé : Course à pied, 45 min' });
    expect(marker).toBeInTheDocument();
    expect(marker.closest('button')).toBeNull();
  });
});
