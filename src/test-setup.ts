import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { chartJsInstances } from './mocks/chart-js.fake';
import { server } from './mocks/server';

// Toute requête HTTP non simulée fait échouer le test.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Chaque test compte les instances Chart.js qu'il crée : le registre fake repart de zéro.
beforeEach(() => {
  chartJsInstances.length = 0;
});
