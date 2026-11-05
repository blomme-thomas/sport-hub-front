import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Serveur MSW pour les tests Vitest (Node). */
export const server = setupServer(...handlers);
