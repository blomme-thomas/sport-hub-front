# sport-hub-front

Dashboard Angular pour visualiser mes données Garmin (activités, charge, récupération) et gérer mes entraînements planifiés. Usage local.

## Prérequis

- Node 26 (`.nvmrc`)
- `sport-hub-back` lancé sur `http://localhost:3000` pour les données réelles

## Démarrage

```bash
npm ci
npm start        # http://localhost:4200, /api est redirigé vers le back
```

## Scripts

| Commande               | Rôle                                          |
| ---------------------- | --------------------------------------------- |
| `npm start`            | Serveur de développement                      |
| `npm run build`        | Build de production                           |
| `npm test`             | Tests unitaires et composants (Vitest)        |
| `npm run e2e`          | Tests end-to-end (Playwright)                 |
| `npm run lint`         | ESLint (`angular-eslint`)                     |
| `npm run format:check` | Vérifie le formatage (Prettier)               |
| `npm run deps:check`   | Garde-fou d'architecture (dependency-cruiser) |

Conventions et architecture : `CLAUDE.md`, `instructions/` et `docs/`.
