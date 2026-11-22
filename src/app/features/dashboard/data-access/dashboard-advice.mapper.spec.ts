import { describe, expect, it } from 'vitest';
import {
  dashboardAdviceApi,
  insufficientDashboardAdviceApi,
} from '../../../../mocks/fixtures/dashboard-advice.fixtures';
import { toDashboardAdvice } from './dashboard-advice.mapper';

describe('toDashboardAdvice', () => {
  it('garde le texte brut et la date de génération d’un conseil de l’IA', () => {
    expect(toDashboardAdvice(dashboardAdviceApi)).toEqual({
      week: '2026-W46',
      text: 'Belle semaine de volume, garde la séance facile de jeudi.',
      insufficient: false,
      generatedAt: '2026-11-09T18:30:00.000Z',
    });
  });

  it('signale une semaine « insuffisant » pour l’afficher en clair', () => {
    expect(toDashboardAdvice(insufficientDashboardAdviceApi).insufficient).toBe(true);
  });
});
