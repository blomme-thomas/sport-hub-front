# Architecture

> Statut : conventions cibles (`instructions/01` et `11`), aucun code livré. À vérifier contre le code dès le premier `ng new`.

## Rôle

Dashboard Angular d'un seul utilisateur, usage local, sans authentification. Il affiche les données exposées par `sport-hub-back` ; il ne contient pas de logique métier Garmin.

## Stack (cible)

Angular (dernière stable), TypeScript strict, composants standalone, signals, ng-zorro-antd, Chart.js, Vitest + Testing Library + MSW, Playwright, ESLint + Prettier.

## Organisation cible

```
src/app/
  core/       config (API_BASE_URL), http (interceptors), layout, erreurs globales
  shared/     ui, pipes, directives, validators, utils
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
