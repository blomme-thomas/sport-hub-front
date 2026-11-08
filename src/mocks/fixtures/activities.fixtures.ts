import type { ActivityListApi } from '../../app/features/dashboard/models/recent-activity.api-model';

/** Quatre séances récentes, de la plus récente à la plus ancienne (ordre renvoyé par l'API). */
export const recentActivitiesResponse: ActivityListApi = {
  items: [
    {
      id: 'act-4',
      garminActivityId: '1004',
      type: 'running',
      startedAt: '2026-11-07T06:30:00.000Z',
      durationSeconds: 2700,
      distanceMeters: 7800,
    },
    {
      id: 'act-3',
      garminActivityId: '1003',
      type: 'cycling',
      startedAt: '2026-11-04T08:00:00.000Z',
      durationSeconds: 4800,
      distanceMeters: 32500,
    },
    {
      id: 'act-2',
      garminActivityId: '1002',
      type: 'lap_swimming',
      startedAt: '2026-10-30T17:15:00.000Z',
      durationSeconds: 3600,
      distanceMeters: null,
    },
    {
      id: 'act-1',
      garminActivityId: '1001',
      type: 'running',
      startedAt: '2026-10-20T06:45:00.000Z',
      durationSeconds: 1800,
      distanceMeters: 5000,
    },
  ],
  page: 1,
  pageSize: 4,
  total: 4,
};
