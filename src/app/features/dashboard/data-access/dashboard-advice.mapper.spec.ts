import { describe, expect, it } from 'vitest';
import {
  adviceApi,
  insufficientAdviceApi,
} from '../../../../mocks/fixtures/dashboard-advice.fixtures';
import { toDashboardAdvice } from './dashboard-advice.mapper';

describe('toDashboardAdvice', () => {
  it('traduit un conseil généré par l’IA', () => {
    expect(toDashboardAdvice(adviceApi)).toEqual({
      week: '2026-W46',
      text: adviceApi.text,
      insufficient: false,
      generatedAt: '2026-11-09T18:30:00.000Z',
    });
  });

  it('signale un conseil « insuffisant »', () => {
    expect(toDashboardAdvice(insufficientAdviceApi).insufficient).toBe(true);
  });
});
