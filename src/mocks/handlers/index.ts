import { activitiesHandlers } from './activities.handlers';
import { activityCommentsHandlers } from './activity-comments.handlers';
import { sessionExportsHandlers } from './session-exports.handlers';
import { dashboardAdviceHandlers } from './dashboard-advice.handlers';
import { dashboardKpisHandlers } from './dashboard-kpis.handlers';
import { foodsHandlers } from './foods.handlers';
import { recipesHandlers } from './recipes.handlers';
import { goalsHandlers } from './goals.handlers';
import { healthHandlers } from './health.handlers';
import { heartRateZonesHandlers } from './heart-rate-zones.handlers';
import { sessionsHandlers } from './sessions.handlers';
import { slotsHandlers } from './slots.handlers';
import { trainingStatsHandlers } from './training-stats.handlers';
import { userSettingsHandlers } from './user-settings.handlers';
import { weeklyGoalHandlers } from './weekly-goal.handlers';
import { weeklyReviewsHandlers } from './weekly-reviews.handlers';

export const handlers = [
  ...healthHandlers,
  ...heartRateZonesHandlers,
  ...trainingStatsHandlers,
  ...goalsHandlers,
  ...foodsHandlers,
  ...recipesHandlers,
  ...slotsHandlers,
  ...sessionsHandlers,
  ...weeklyReviewsHandlers,
  ...activitiesHandlers,
  ...activityCommentsHandlers,
  ...sessionExportsHandlers,
  ...dashboardKpisHandlers,
  ...dashboardAdviceHandlers,
  ...weeklyGoalHandlers,
  ...userSettingsHandlers,
];
