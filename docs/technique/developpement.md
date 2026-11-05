# Développement

## Prérequis

Node 26 (`.nvmrc`), npm 11. Angular 22.

## Commandes

| Commande             | Rôle                                                                           |
| -------------------- | ------------------------------------------------------------------------------ |
| `npm start`          | `ng serve` sur `http://localhost:4200`, proxy `/api` vers le back              |
| `npm run build`      | Build de production dans `dist/`                                               |
| `npm test`           | Vitest ; `npm test -- --no-watch` pour une exécution unique                    |
| `npm run e2e`        | Playwright (Chromium), démarre `npm start` si besoin                           |
| `npm run lint`       | ESLint (`angular-eslint`)                                                      |
| `npm run format`     | Prettier en écriture ; `format:check` pour vérifier                            |
| `npm run deps:check` | dependency-cruiser : règles de dépendance entre `core`, `shared` et `features` |

Première utilisation de Playwright : `npx playwright install chromium`.

## Installation et lancement local

1. `npm ci`
2. Lancer `sport-hub-back` (port 3000).
3. `npm start`, puis ouvrir `http://localhost:4200`.

Le back n'active pas CORS : en développement, le navigateur appelle `/api/...` sur le serveur Angular, qui redirige vers `http://localhost:3000` en retirant le préfixe `/api` (`proxy.conf.json`).

## Configuration / variables d'environnement

- `src/environments/environment.ts` (production) et `environment.development.ts` (remplacé au `ng serve`) exposent `apiBaseUrl` (`/api`).
- `apiBaseUrl` alimente le token `API_BASE_URL` (`src/app/core/config/api-base-url.token.ts`), fourni dans `app.config.ts`.

## Tests

- Unitaires et composants : Vitest + Testing Library. `src/test-setup.ts` démarre le serveur MSW (`src/mocks/`) et fait échouer toute requête non simulée.
- E2E : `e2e/` (config, page objects, specs). L'API est simulée par `page.route()` ou les handlers MSW.
