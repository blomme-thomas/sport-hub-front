# Architecture

> Statut : le socle Angular est livré, ainsi que `core/config`, `core/layout`, `core/http` (intercepteur d'erreur et conversion Problem Details en `AppError`, voir `integration-api.md`) et `shared/ui/chart` (`sh-chart`). Aucune feature métier n'est encore créée.

## Rôle

Dashboard Angular d'un seul utilisateur, usage local, sans authentification. Il affiche les données exposées par `sport-hub-back` ; il ne contient pas de logique métier Garmin.

## Stack (cible)

Angular (dernière stable), TypeScript strict, composants standalone, signals, ng-zorro-antd, Chart.js, Vitest + Testing Library + MSW, Playwright, ESLint + Prettier.

## Organisation

```
src/app/
  core/       config (API_BASE_URL), http (intercepteur d'erreur, conversion Problem Details en AppError), layout
  shared/     ui (sh-chart), pipes, directives, validators, utils (seul ui est livré)
  features/<feature>/
    pages/ components/ data-access/ models/ <feature>.routes.ts
```

Règles : une feature n'importe jamais une autre feature ; routes lazy ; pages (smart) vs composants de présentation (dumb).

## Features prévues

| Feature      | Domaine                              | Statut  |
| ------------ | ------------------------------------ | ------- |
| `activities` | Activités Garmin                     | à créer |
| `load`       | Charge d'entraînement                | à créer |
| `recovery`   | Récupération                         | à créer |
| `workouts`   | Séances planifiées / générées par IA | à créer |

## Flux entre features

À compléter.
