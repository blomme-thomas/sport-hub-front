import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { chartJsInstances } from './mocks/chart-js.fake';
import { server } from './mocks/server';

// Chart.js n'est jamais réel dans les tests (jsdom ne sait pas dessiner) : toute spec reçoit le registre fake.
vi.mock('chart.js', async () => (await import('./mocks/chart-js.fake')).chartJsModule);

// Toute requête HTTP non simulée fait échouer le test.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Chaque test compte les instances Chart.js qu'il crée : le registre fake repart de zéro.
beforeEach(() => {
  chartJsInstances.length = 0;
});
