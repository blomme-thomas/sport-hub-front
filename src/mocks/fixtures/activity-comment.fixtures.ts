import type { ActivityCommentApi } from '../../app/features/dashboard/models/activity-comment.api-model';

export const ACTIVITY_ID = 'act-1';

export const activityCommentApi: ActivityCommentApi = {
  activityId: ACTIVITY_ID,
  text: "Bonne sortie : l'allure est restée dans la zone visée, la fin de séance a un peu décroché.",
  source: 'ia',
  model: 'claude-sonnet-5-5',
  generatedAt: '2026-11-12T20:00:00.000Z',
};
