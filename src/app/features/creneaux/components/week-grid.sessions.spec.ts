import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SessionOccurrence } from '../models/session-occurrence.model';
import type { WeekDay } from '../models/week-day.model';
import { WeekGridComponent } from './week-grid.component';

// jsdom n'implémente pas la capture du pointeur, utilisée lors d'un appui sur un bloc.
Element.prototype.setPointerCapture = vi.fn();

const TUESDAY = '2026-11-10';

const seance: SessionOccurrence = {
  id: 'session-course',
  date: TUESDAY,
  startTime: '18:00',
  durationMinutes: 45,
  disciplineTypeKey: 'running',
  recurrence: 'aucune',
  status: 'planifiee',
};

function days(sessions: SessionOccurrence[]): WeekDay[] {
  return [
    { date: '2026-11-09', slots: [], sessions: [] },
    { date: TUESDAY, slots: [], sessions },
    { date: '2026-11-11', slots: [], sessions: [] },
    { date: '2026-11-12', slots: [], sessions: [] },
    { date: '2026-11-13', slots: [], sessions: [] },
    { date: '2026-11-14', slots: [], sessions: [] },
    { date: '2026-11-15', slots: [], sessions: [] },
  ];
}

describe('WeekGridComponent : séances', () => {
  it('affiche une séance avec le libellé de sa discipline et sa plage', async () => {
    await render(WeekGridComponent, {
      inputs: { days: days([seance]), labels: new Map([['running', 'Course à pied']]) },
      on: { slotSelected: vi.fn(), sessionSelected: vi.fn(), rangeSelected: vi.fn() },
    });

    expect(
      screen.getByRole('button', { name: 'Séance Course à pied, 18:00 – 18:45. Ouvrir la séance' }),
    ).toBeInTheDocument();
  });

  it('émet la séance au clic, sans l’assimiler à un créneau', async () => {
    const user = userEvent.setup();
    const sessionSelected = vi.fn();
    const slotSelected = vi.fn();
    await render(WeekGridComponent, {
      inputs: { days: days([seance]) },
      on: { slotSelected, sessionSelected, rangeSelected: vi.fn() },
    });

    await user.click(screen.getByRole('button', { name: /^Séance/ }));

    expect(sessionSelected).toHaveBeenCalledWith(seance);
    expect(slotSelected).not.toHaveBeenCalled();
  });
});
