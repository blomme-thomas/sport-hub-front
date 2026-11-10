import { describe, expect, it } from 'vitest';
import { toCompletionView } from './completion.mapper';

const TODAY = '2026-11-10';

describe('toCompletionView', () => {
  it('calcule le pourcentage de séances réalisées parmi les séances dues', () => {
    const view = toCompletionView(
      [
        { date: '2026-11-04', status: 'realisee' },
        { date: '2026-11-06', status: 'manquee' },
        { date: '2026-11-08', status: 'realisee' },
        { date: '2026-11-09', status: 'planifiee' },
      ],
      TODAY,
    );

    expect(view).toEqual({ realised: 2, expected: 4, percent: 50 });
  });

  it('ignore les séances annulées et les séances futures', () => {
    const view = toCompletionView(
      [
        { date: '2026-11-04', status: 'realisee' },
        { date: '2026-11-05', status: 'annulee' },
        { date: '2026-11-11', status: 'planifiee' },
      ],
      TODAY,
    );

    expect(view).toEqual({ realised: 1, expected: 1, percent: 100 });
  });

  it('compte le jour même comme dû', () => {
    expect(toCompletionView([{ date: TODAY, status: 'planifiee' }], TODAY)).toEqual({
      realised: 0,
      expected: 1,
      percent: 0,
    });
  });

  it('arrondit au pourcentage entier', () => {
    const view = toCompletionView(
      [
        { date: '2026-11-01', status: 'realisee' },
        { date: '2026-11-02', status: 'manquee' },
        { date: '2026-11-03', status: 'manquee' },
      ],
      TODAY,
    );

    expect(view.percent).toBe(33);
  });

  it('renvoie un pourcentage nul sans séance due, sans valeur fictive', () => {
    expect(toCompletionView([{ date: '2026-11-12', status: 'planifiee' }], TODAY)).toEqual({
      realised: 0,
      expected: 0,
      percent: null,
    });
    expect(toCompletionView([], TODAY).percent).toBeNull();
  });
});
