import { http, HttpResponse } from 'msw';
import { shoppingListFixtures } from '../fixtures/shopping-list.fixtures';

export const shoppingListHandlers = [
  http.get('*/api/shopping-list', () => HttpResponse.json(shoppingListFixtures)),
];
