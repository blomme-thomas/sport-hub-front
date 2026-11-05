import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/** Worker MSW pour le navigateur (dev sans back, E2E). */
export const worker = setupWorker(...handlers);
