import { describe, expect, it } from 'vitest';
import type { MonthActivity } from '../models/training-month.model';
import { buildMonthWeeks, firstDayOfMonth, shiftMonth } from './training-month.grid';

const RUN: MonthActivity = {
  id: 'act-1',
  typeLabel: 'Course à pied',
  durationLabel: '45 min',
  discipline: { icon: 'run', color: 'var(--sh-success)' },
};

describe('buildMonthWeeks', () => {
  it('complète les semaines lundi → dimanche avec les jours des mois voisins grisés', () => {
    // Novembre 2026 commence un dimanche : la première semaine part du lundi 26 octobre.
    const weeks = buildMonthWeeks('2026-11-01', new Map(), '2026-11-11');

    expect(weeks).toHaveLength(6);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]?.[0]?.date).toBe('2026-10-26');
    expect(weeks[5]?.[6]?.date).toBe('2026-12-06');
    expect(weeks.flat().filter((day) => day.inMonth)).toHaveLength(30);
    expect(weeks[0]?.[0]?.inMonth).toBe(false);
  });

  it('marque le jour courant', () => {
    const today = buildMonthWeeks('2026-11-01', new Map(), '2026-11-11')
      .flat()
      .filter((day) => day.isToday);

    expect(today.map((day) => day.date)).toEqual(['2026-11-11']);
  });

  it('place les activités sur leur jour, avec un libellé accessible complet', () => {
    const byDate = new Map([['2026-11-08', [RUN]]]);

    const day = buildMonthWeeks('2026-11-01', byDate, '2026-11-11')
      .flat()
      .find((item) => item.date === '2026-11-08');

    expect(day?.activities).toEqual([RUN]);
    expect(day?.label).toBe('8 novembre, Course à pied, 45 min');
  });

  it('donne un libellé sans activité pour un jour vide', () => {
    const day = buildMonthWeeks('2026-11-01', new Map(), '2026-11-11')
      .flat()
      .find((item) => item.date === '2026-11-02');

    expect(day?.activities).toEqual([]);
    expect(day?.label).toBe('2 novembre');
  });
});

describe('firstDayOfMonth et shiftMonth', () => {
  it('ramène une date au 1er de son mois', () => {
    expect(firstDayOfMonth('2026-11-15')).toBe('2026-11-01');
  });

  it('passe au mois suivant ou précédent, en gardant le 1er', () => {
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01');
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
  });
});
