import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
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

const occupeHebdo: Slot = {
  id: 'slot-occupe',
  type: 'occupe',
  date: TUESDAY,
  startTime: '18:00',
  endTime: '19:00',
  recurrence: 'hebdomadaire',
};

const chevauche: Slot = { ...libre, id: 'slot-chevauche', startTime: '10:00', endTime: '11:00' };

function week(slotsOfTuesday: Slot[]): WeekDay[] {
  return [
    { date: '2026-11-09', slots: [] },
    { date: TUESDAY, slots: slotsOfTuesday },
    { date: '2026-11-11', slots: [] },
    { date: '2026-11-12', slots: [] },
    { date: '2026-11-13', slots: [] },
    { date: '2026-11-14', slots: [] },
    { date: '2026-11-15', slots: [] },
  ];
}

async function renderGrid(slots: Slot[]) {
  const slotSelected = vi.fn();
  const rangeSelected = vi.fn();
  await render(WeekGridComponent, {
    inputs: { days: week(slots) },
    on: { slotSelected, rangeSelected },
  });
  return { slotSelected, rangeSelected };
}

/** jsdom n'implémente pas PointerEvent : on s'appuie sur MouseEvent, qui porte clientY et button. */
class PointerEventPolyfill extends MouseEvent {
  readonly pointerId: number;

  constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
  }
}

describe('WeekGridComponent', () => {
  const originalPointerEvent = globalThis.PointerEvent;

  beforeAll(() => {
    globalThis.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
    Element.prototype.setPointerCapture = vi.fn();
  });

  afterAll(() => {
    globalThis.PointerEvent = originalPointerEvent;
  });

  it('affiche une colonne par jour, nommée par sa date complète', async () => {
    await renderGrid([]);

    expect(screen.getByRole('group', { name: 'mardi 10 novembre 2026' })).toBeInTheDocument();
    expect(screen.getAllByRole('group')).toHaveLength(7);
  });

  it('affiche chaque créneau comme un bouton dont le nom décrit le type et les heures', async () => {
    await renderGrid([libre, occupeHebdo]);

    expect(
      screen.getByRole('button', { name: 'Libre, 09:00 – 10:30. Modifier' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Occupé, 18:00 – 19:00, chaque semaine. Modifier' }),
    ).toBeInTheDocument();
  });

  it('affiche les créneaux qui se chevauchent tous les deux', async () => {
    await renderGrid([libre, chevauche]);

    expect(screen.getByRole('button', { name: /09:00 – 10:30/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /10:00 – 11:00/ })).toBeInTheDocument();
  });

  it('émet le créneau choisi au clic sur son bouton', async () => {
    const user = userEvent.setup();
    const { slotSelected } = await renderGrid([libre]);

    await user.click(screen.getByRole('button', { name: /09:00 – 10:30/ }));

    expect(slotSelected).toHaveBeenCalledWith(libre);
  });

  it('émet une plage de 30 minutes au pas, de 02:00 à 03:00 selon le glisser', async () => {
    const { rangeSelected } = await renderGrid([]);
    const column = screen.getByRole('group', { name: 'mardi 10 novembre 2026' });

    // Hauteur d'une heure = 48 px : 96 px = 02:00, 144 px = 03:00.
    fireEvent.pointerDown(column, { clientY: 96, button: 0, pointerId: 1 });
    fireEvent.pointerMove(column, { clientY: 144, pointerId: 1 });
    fireEvent.pointerUp(column, { clientY: 144, pointerId: 1 });

    expect(rangeSelected).toHaveBeenCalledWith({
      date: TUESDAY,
      startTime: '02:00',
      endTime: '03:00',
    });
  });

  it('propose une heure à partir du point cliqué sans glisser', async () => {
    const { rangeSelected } = await renderGrid([]);
    const column = screen.getByRole('group', { name: 'mardi 10 novembre 2026' });

    fireEvent.pointerDown(column, { clientY: 96, button: 0, pointerId: 1 });
    fireEvent.pointerUp(column, { clientY: 96, pointerId: 1 });

    expect(rangeSelected).toHaveBeenCalledWith({
      date: TUESDAY,
      startTime: '02:00',
      endTime: '03:00',
    });
  });

  it('ne propose jamais de fin à 24:00 : la plage finit à 23:59 au plus', async () => {
    const { rangeSelected } = await renderGrid([]);
    const column = screen.getByRole('group', { name: 'mardi 10 novembre 2026' });

    fireEvent.pointerDown(column, { clientY: 1152, button: 0, pointerId: 1 });
    fireEvent.pointerUp(column, { clientY: 1152, pointerId: 1 });

    expect(rangeSelected).toHaveBeenCalledWith({
      date: TUESDAY,
      startTime: '23:30',
      endTime: '23:59',
    });
  });

  it('ne démarre pas de sélection depuis un créneau existant', async () => {
    const { rangeSelected } = await renderGrid([libre]);
    const slotButton = screen.getByRole('button', { name: /09:00 – 10:30/ });

    fireEvent.pointerDown(slotButton, { clientY: 96, button: 0, pointerId: 1 });
    fireEvent.pointerUp(slotButton, { clientY: 96, pointerId: 1 });

    expect(rangeSelected).not.toHaveBeenCalled();
  });
});
