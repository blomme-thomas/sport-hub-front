import { activitiesHandlers } from './activities.handlers';
import { dashboardAdviceHandlers } from './dashboard-advice.handlers';
import { activityCommentsHandlers } from './activity-comments.handlers';
import { dashboardKpisHandlers } from './dashboard-kpis.handlers';
import { goalsHandlers } from './goals.handlers';
import { profileHandlers } from './profile.handlers';
import { healthHandlers } from './health.handlers';
import { heartRateZonesHandlers } from './heart-rate-zones.handlers';
import { sessionsHandlers } from './sessions.handlers';
import { slotsHandlers } from './slots.handlers';
import { trainingStatsHandlers } from './training-stats.handlers';
import { weeklyReviewsHandlers } from './weekly-reviews.handlers';

export const handlers = [
  ...healthHandlers,
  ...heartRateZonesHandlers,
  ...trainingStatsHandlers,
  ...goalsHandlers,
  ...slotsHandlers,
  ...sessionsHandlers,
  ...weeklyReviewsHandlers,
  ...dashboardAdviceHandlers,
  ...activitiesHandlers,
  ...activityCommentsHandlers,
  ...dashboardKpisHandlers,
  ...profileHandlers,
];
