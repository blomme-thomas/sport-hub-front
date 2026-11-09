import { activitiesHandlers } from './activities.handlers';
import { dashboardKpisHandlers } from './dashboard-kpis.handlers';
import { goalsHandlers } from './goals.handlers';
import { healthHandlers } from './health.handlers';
import { sessionsHandlers } from './sessions.handlers';
import { slotsHandlers } from './slots.handlers';
import { trainingStatsHandlers } from './training-stats.handlers';

export const handlers = [
  ...healthHandlers,
  ...trainingStatsHandlers,
  ...goalsHandlers,
  ...slotsHandlers,
  ...sessionsHandlers,
  ...activitiesHandlers,
  ...dashboardKpisHandlers,
];
