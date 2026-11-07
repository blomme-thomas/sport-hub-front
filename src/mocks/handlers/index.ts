import { healthHandlers } from './health.handlers';
import { trainingStatsHandlers } from './training-stats.handlers';

export const handlers = [...healthHandlers, ...trainingStatsHandlers];
