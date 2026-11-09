import { describe, expect, it } from 'vitest';
import type { Slot } from '../models/slot.model';
import {
  layoutDaySlots,
  mondayOf,
  minutesToTime,
  timeToMinutes,
  toCreateRequest,
  toSavedSlot,
  toSlot,
  toUpdateRequest,
  weekDates,
} from './slot.mapper';

const libre: Slot = {
  id: 'slot-libre',
  type: 'libre',
  date: '2026-11-10',
  startTime: '09:00',
  endTime: '10:30',
  recurrence: 'aucune',
};

function slot(id: string, startTime: string, endTime: string): Slot {
  return { ...libre, id, startTime, endTime };
}

describe('slot.mapper', () => {
  describe('conversion API → modèle', () => {
    it('prend l’identifiant du créneau (slotId) pour une occurrence', () => {
      expect(
        toSlot({
          slotId: 'slot-libre',
          type: 'libre',
          date: '2026-11-10',
          startTime: '09:00',
          endTime: '10:30',
          recurrence: 'aucune',
          timeZone: 'Europe/Paris',
        }),
      ).toEqual(libre);
    });

    it('prend l’identifiant de la réponse d’écriture (id)', () => {
      expect(
        toSavedSlot({
          id: 'slot-libre',
          type: 'libre',
          date: '2026-11-10',
          startTime: '09:00',
          endTime: '10:30',
          recurrence: 'aucune',
          timeZone: 'Europe/Paris',
        }),
      ).toEqual(libre);
    });
  });

  describe('corps des requêtes', () => {
    const input = {
      type: 'occupe' as const,
      date: '2026-11-12',
      startTime: '18:00',
      endTime: '19:00',
      recurrence: 'hebdomadaire' as const,
    };

    it('ajoute le fuseau du navigateur à la création', () => {
      expect(toCreateRequest(input, 'Europe/Paris')).toEqual({
        ...input,
        timeZone: 'Europe/Paris',
      });
    });

    it('n’envoie pas de fuseau à la modification, qui reste inchangé côté back', () => {
      expect(toUpdateRequest(input)).toEqual(input);
    });
  });

  describe('semaine', () => {
    it('renvoie le lundi de la semaine ISO, y compris pour un dimanche', () => {
      expect(mondayOf('2026-11-08')).toBe('2026-11-02');
      expect(mondayOf('2026-11-09')).toBe('2026-11-09');
      expect(mondayOf('2026-11-15')).toBe('2026-11-09');
    });

    it('franchit correctement la fin d’année', () => {
      expect(mondayOf('2027-01-01')).toBe('2026-12-28');
      expect(weekDates('2026-12-28')).toEqual([
        '2026-12-28',
        '2026-12-29',
        '2026-12-30',
        '2026-12-31',
        '2027-01-01',
        '2027-01-02',
        '2027-01-03',
      ]);
    });
  });

  describe('heures', () => {
    it('convertit HH:mm en minutes et inversement', () => {
      expect(timeToMinutes('09:30')).toBe(570);
      expect(minutesToTime(570)).toBe('09:30');
    });

    it('borne l’heure de fin à 23:59, car le back refuse 24:00', () => {
      expect(minutesToTime(1440)).toBe('23:59');
    });
  });

  describe('mise en colonnes des chevauchements', () => {
    it('garde un créneau seul sur toute la largeur', () => {
      const [only] = layoutDaySlots([slot('a', '09:00', '10:00')]);

      expect(only).toMatchObject({ lane: 0, laneCount: 1, startMinutes: 540, endMinutes: 600 });
    });

    it('place deux créneaux qui se chevauchent côte à côte', () => {
      const placed = layoutDaySlots([slot('a', '09:00', '11:00'), slot('b', '10:00', '12:00')]);

      expect(placed.map((item) => [item.slot.id, item.lane, item.laneCount])).toEqual([
        ['a', 0, 2],
        ['b', 1, 2],
      ]);
    });

    it('réutilise la première colonne libre quand un créneau est fini', () => {
      const placed = layoutDaySlots([
        slot('a', '09:00', '10:00'),
        slot('b', '09:30', '11:00'),
        slot('c', '10:00', '11:00'),
      ]);

      expect(placed.map((item) => [item.slot.id, item.lane])).toEqual([
        ['a', 0],
        ['b', 1],
        ['c', 0],
      ]);
      expect(new Set(placed.map((item) => item.laneCount))).toEqual(new Set([2]));
    });

    it('ne compte pas comme chevauchement deux créneaux qui se touchent', () => {
      const placed = layoutDaySlots([slot('a', '09:00', '10:00'), slot('b', '10:00', '11:00')]);

      expect(placed.map((item) => item.laneCount)).toEqual([1, 1]);
    });

    it('calcule les colonnes de chaque groupe séparément', () => {
      const placed = layoutDaySlots([
        slot('a', '09:00', '10:00'),
        slot('b', '09:30', '10:30'),
        slot('c', '14:00', '15:00'),
      ]);

      expect(placed.find((item) => item.slot.id === 'c')).toMatchObject({
        lane: 0,
        laneCount: 1,
      });
    });
  });
});
