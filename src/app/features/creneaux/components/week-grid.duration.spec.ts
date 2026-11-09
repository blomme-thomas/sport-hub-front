import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SessionOccurrence } from '../models/session-occurrence.model';
import type { WeekDay } from '../models/week-day.model';
import { WeekGridComponent } from './week-grid.component';

// jsdom n'implémente pas la capture du pointeur, utilisée lors d'un appui sur un bloc.
Element.prototype.setPointerCapture = vi.fn();

const TUESDAY = '2026-11-10';

const planifiee: SessionOccurrence = {
  id: 'session-course',
  date: TUESDAY,
  startTime: '18:00',
  durationMinutes: 45,
  disciplineTypeKey: 'running',
  recurrence: 'aucune',
  status: 'planifiee',
};

const realisee: SessionOccurrence = {
  ...planifiee,
  id: 'session-faite',
  status: 'realisee',
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

describe('WeekGridComponent : durée et séances réalisées', () => {
  it('propose la modification de la durée depuis la vignette d’une séance planifiée', async () => {
    const durationRequested = vi.fn();
    await render(WeekGridComponent, {
      inputs: { days: days([planifiee]), labels: new Map([['running', 'Course à pied']]) },
      on: {
        slotSelected: vi.fn(),
        sessionSelected: vi.fn(),
        rangeSelected: vi.fn(),
        durationRequested,
      },
    });

    await userEvent.click(
      screen.getByRole('button', { name: /Modifier la durée de la séance 18:00/ }),
    );

    expect(durationRequested).toHaveBeenCalledWith(planifiee);
  });

  it('n’affiche pas le bouton « Durée » pour une séance réalisée et le signale', async () => {
    await render(WeekGridComponent, {
      inputs: { days: days([realisee]), labels: new Map([['running', 'Course à pied']]) },
      on: { slotSelected: vi.fn(), sessionSelected: vi.fn(), rangeSelected: vi.fn() },
    });

    expect(screen.queryByRole('button', { name: /Modifier la durée/ })).toBeNull();
    expect(screen.getByRole('button', { name: /réalisée/ })).toBeTruthy();
    expect(screen.getByText('Réalisée, déplacement impossible')).toBeTruthy();
  });

  it('ne déplace pas une séance réalisée au glisser', async () => {
    const moved = vi.fn();
    await render(WeekGridComponent, {
      inputs: { days: days([realisee]), labels: new Map([['running', 'Course à pied']]) },
      on: { slotSelected: vi.fn(), sessionSelected: vi.fn(), rangeSelected: vi.fn(), moved },
    });
    const block = screen.getByRole('button', { name: /réalisée/ });

    fireEvent.pointerDown(block, { clientX: 10, clientY: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(block, { clientX: 10, clientY: 148, pointerId: 1 });
    fireEvent.pointerUp(block, { clientX: 10, clientY: 148, pointerId: 1 });

    expect(moved).not.toHaveBeenCalled();
  });
});
