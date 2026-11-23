import { resetFoodsMock, foodsHandlers } from './foods.handlers';
import { resetRecipesMock, recipesHandlers } from './recipes.handlers';
import { resetMealPlanMock, mealPlanHandlers } from './meal-plan.handlers';
import { activitiesHandlers } from './activities.handlers';
import { activityCommentsHandlers } from './activity-comments.handlers';
import { sessionExportsHandlers } from './session-exports.handlers';
import { dashboardAdviceHandlers } from './dashboard-advice.handlers';
import { dashboardKpisHandlers } from './dashboard-kpis.handlers';
import { shoppingListHandlers } from './shopping-list.handlers';
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
  ...mealPlanHandlers,
  ...shoppingListHandlers,
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

/** Remet à zéro l'état mutable des mocks ajoutés pour l'alimentation, pour qu'un test ne voie pas les écritures d'un autre. */
export function resetMockData(): void {
  resetFoodsMock();
  resetRecipesMock();
  resetMealPlanMock();
}
