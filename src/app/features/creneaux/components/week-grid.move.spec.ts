import { fireEvent, render, screen } from '@testing-library/angular';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { SessionOccurrence } from '../models/session-occurrence.model';
import type { Slot } from '../models/slot.model';
import type { WeekDay } from '../models/week-day.model';
import { WeekGridComponent } from './week-grid.component';

const TUESDAY = '2026-11-10';

const libre: Slot = {
  id: 'slot-libre',
  type: 'libre',
  date: TUESDAY,
  startTime: '09:00',
  endTime: '10:30',
  recurrence: 'aucune',
};

const seancePonctuelle: SessionOccurrence = {
  id: 'session-course',
  date: TUESDAY,
  startTime: '18:00',
  durationMinutes: 45,
  disciplineTypeKey: 'running',
  recurrence: 'aucune',
  status: 'planifiee',
};

const seanceRecurrente: SessionOccurrence = {
  ...seancePonctuelle,
  id: 'session-piscine',
  recurrence: 'hebdomadaire',
};

function days(slots: Slot[], sessions: SessionOccurrence[]): WeekDay[] {
  return [
    { date: '2026-11-09', slots: [], sessions: [] },
    { date: TUESDAY, slots, sessions },
    { date: '2026-11-11', slots: [], sessions: [] },
    { date: '2026-11-12', slots: [], sessions: [] },
    { date: '2026-11-13', slots: [], sessions: [] },
    { date: '2026-11-14', slots: [], sessions: [] },
    { date: '2026-11-15', slots: [], sessions: [] },
  ];
}

/** jsdom n'implémente pas PointerEvent : on s'appuie sur MouseEvent, qui porte clientX, clientY et button. */
class PointerEventPolyfill extends MouseEvent {
  readonly pointerId: number;

  constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
  }
}

describe('WeekGridComponent : déplacement', () => {
  const originalPointerEvent = globalThis.PointerEvent;

  beforeAll(() => {
    globalThis.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
    Element.prototype.setPointerCapture = vi.fn();
  });

  afterAll(() => {
    globalThis.PointerEvent = originalPointerEvent;
  });

  it('déplace un créneau d’une heure vers le bas en gardant sa durée', async () => {
    const moved = vi.fn();
    await render(WeekGridComponent, {
      inputs: { days: days([libre], []) },
      on: { slotSelected: vi.fn(), sessionSelected: vi.fn(), rangeSelected: vi.fn(), moved },
    });
    const block = screen.getByRole('button', { name: /09:00 – 10:30/ });

    // 48 px = une heure dans la grille ; pas de colonne détectée en jsdom, le jour ne change pas.
    fireEvent.pointerDown(block, { clientX: 10, clientY: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(block, { clientX: 10, clientY: 148, pointerId: 1 });
    fireEvent.pointerUp(block, { clientX: 10, clientY: 148, pointerId: 1 });

    expect(moved).toHaveBeenCalledWith({
      kind: 'slot',
      slot: libre,
      date: TUESDAY,
      startTime: '10:00',
      endTime: '11:30',
    });
  });

  it('déplace une séance ponctuelle sans changer sa durée', async () => {
    const moved = vi.fn();
    await render(WeekGridComponent, {
      inputs: { days: days([], [seancePonctuelle]) },
      on: { slotSelected: vi.fn(), sessionSelected: vi.fn(), rangeSelected: vi.fn(), moved },
    });
    const block = screen.getByRole('button', { name: /^Séance/ });

    fireEvent.pointerDown(block, { clientX: 10, clientY: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(block, { clientX: 10, clientY: 52, pointerId: 1 });
    fireEvent.pointerUp(block, { clientX: 10, clientY: 52, pointerId: 1 });

    expect(moved).toHaveBeenCalledWith({
      kind: 'session',
      session: seancePonctuelle,
      date: TUESDAY,
      startTime: '17:00',
    });
  });

  it('signale le déplacement d’une séance récurrente, à confirmer par la page (cette semaine ou la série)', async () => {
    const moved = vi.fn();
    await render(WeekGridComponent, {
      inputs: { days: days([], [seanceRecurrente]) },
      on: { slotSelected: vi.fn(), sessionSelected: vi.fn(), rangeSelected: vi.fn(), moved },
    });
    const block = screen.getByRole('button', { name: /^Séance/ });

    fireEvent.pointerDown(block, { clientX: 10, clientY: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(block, { clientX: 10, clientY: 148, pointerId: 1 });
    fireEvent.pointerUp(block, { clientX: 10, clientY: 148, pointerId: 1 });

    expect(moved).toHaveBeenCalledWith({
      kind: 'session',
      session: seanceRecurrente,
      date: TUESDAY,
      startTime: '19:00',
    });
  });

  it('un simple clic ouvre l’élément sans le déplacer', async () => {
    const moved = vi.fn();
    const slotSelected = vi.fn();
    await render(WeekGridComponent, {
      inputs: { days: days([libre], []) },
      on: { slotSelected, sessionSelected: vi.fn(), rangeSelected: vi.fn(), moved },
    });
    const block = screen.getByRole('button', { name: /09:00 – 10:30/ });

    fireEvent.pointerDown(block, { clientX: 10, clientY: 100, button: 0, pointerId: 1 });
    fireEvent.pointerUp(block, { clientX: 10, clientY: 101, pointerId: 1 });
    fireEvent.click(block);

    expect(moved).not.toHaveBeenCalled();
    expect(slotSelected).toHaveBeenCalledWith(libre);
  });
});
