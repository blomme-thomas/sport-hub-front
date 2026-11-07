# Architecture

> Statut : le socle Angular est livré, ainsi que `core/config`, `core/layout`, `core/http` (intercepteur d'erreur et conversion Problem Details en `AppError`, voir `integration-api.md`) et `shared/ui/chart` (`sh-chart`). La feature `dashboard` (issue #7) est implémentée ; les autres features restent à créer.

## Rôle

Dashboard Angular d'un seul utilisateur, usage local, sans authentification. Il affiche les données exposées par `sport-hub-back` ; il ne contient pas de logique métier Garmin.

## Stack (cible)

Angular (dernière stable), TypeScript strict, composants standalone, signals, ng-zorro-antd, Chart.js, Vitest + Testing Library + MSW, Playwright, ESLint + Prettier.

## Organisation

```
src/app/
  core/       config (API_BASE_URL), http (intercepteur d'erreur, conversion Problem Details en AppError), layout
  shared/     ui (sh-chart), utils (css-var), pipes, directives, validators (seuls ui et utils sont livrés)
  features/<feature>/
    pages/ components/ data-access/ models/ <feature>.routes.ts
```

Règles : une feature n'importe jamais une autre feature ; routes lazy ; pages (smart) vs composants de présentation (dumb).

## Features

| Feature      | Domaine                                 | Statut                 |
| ------------ | --------------------------------------- | ---------------------- |
| `dashboard`  | Tableau de bord (volume d'entraînement) | implémentée (issue #7) |
| `activities` | Activités Garmin                        | à créer                |
| `load`       | Charge d'entraînement                   | à créer                |
| `recovery`   | Récupération                            | à créer                |
| `workouts`   | Séances planifiées / générées par IA    | à créer                |

## Flux entre features

Aucun flux pour l'instant : `dashboard` n'importe que `core` et `shared`. Le reste est à compléter.
