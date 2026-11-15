import { describe, expect, it } from 'vitest';
import { activityCommentApi } from '../../../../mocks/fixtures/activity-comment.fixtures';
import { toActivityComment } from './activity-comment.mapper';

describe('toActivityComment', () => {
  it('traduit un commentaire généré par l’IA', () => {
    expect(toActivityComment(activityCommentApi)).toEqual({
      text: activityCommentApi.text,
      generic: false,
      model: 'claude-sonnet-5-5',
      generatedAt: '2026-11-12T20:00:00.000Z',
    });
  });

  it('signale un commentaire générique, sans modèle', () => {
    const comment = toActivityComment({ ...activityCommentApi, source: 'generique', model: null });

    expect(comment.generic).toBe(true);
    expect(comment.model).toBeNull();
  });
});
