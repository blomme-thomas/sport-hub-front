---
description: 'Conventions concrètes de sport-hub-front : stack, arborescence, nommage, commandes, table des templates. Source de vérité citée par tous les autres fichiers (« 11 »).'
applyTo: '**'
---

# Conventions du dépôt (sport-hub-front)

> Le socle Angular est en place (`ng new` exécuté, commandes ci-dessous confirmées). Dès que le code réel diverge sur un point précis, **mettre à jour ce fichier** (cf. `10` §Contradictions).

## Stack

- Angular 22, TypeScript `strict`, `strictTemplates`, composants standalone, signals, zoneless (par défaut depuis Angular 22), Node 26 (`.nvmrc`).
- UI : **ng-zorro-antd** (Ant Design, MIT) (`08`). PrimeNG écarté : depuis la v22 il exige une clé de licence PrimeUI (bandeau « Invalid PrimeUI License » sans clé).
- Graphiques : **Chart.js** via un wrapper maison unique `shared/ui/chart` (`08`).
- Alias de chemins : `@core/*`, `@shared/*`, `@features/*`, `@env/*` (`tsconfig.json`).
- État : services + signals ; NgRx SignalStore seulement si justifié (`03`).
- Tests : **Vitest** + **@testing-library/angular** + **MSW** (`09`) ; E2E **Playwright** (`09b`).
- Qualité : ESLint (`angular-eslint`) + Prettier.
- API : `sport-hub-back` (NestJS), sans authentification.

## Arborescence

```
src/
  app/
    core/            # config (API_BASE_URL), http (interceptors), layout, erreurs globales
    shared/          # ui/, pipes/, directives/, validators/, utils/
    features/<feature>/
      pages/<name>.page.ts|html|scss        # composants routés
      components/<name>.component.ts|html|scss
      data-access/<name>.api.ts, <name>.state.ts, <name>.mapper.ts
      models/<name>.model.ts, <name>.api-model.ts
      <feature>.routes.ts
    app.config.ts · app.routes.ts · app.ts
  mocks/             # MSW : handlers/, browser.ts, server.ts
  environments/
e2e/                 # Playwright (09b)
instructions/        # règles + templates (ce dossier)
```

Features prévues : `activities`, `load` (charge), `recovery`, `workouts` (séances planifiées/IA).

## Nommage

| Artefact         | Fichier                               | Classe / symbole                                            |
| ---------------- | ------------------------------------- | ----------------------------------------------------------- |
| Composant        | `<name>.component.ts`                 | `<Name>Component`, sélecteur `sh-<name>`                    |
| Page routée      | `<name>.page.ts`                      | `<Name>Page`, sélecteur `sh-<name>-page`                    |
| Service API      | `<name>.api.ts`                       | `<Name>Api`                                                 |
| État / store     | `<name>.state.ts` / `<name>.store.ts` | `<Name>State` / `<Name>Store`                               |
| Mapper           | `<name>.mapper.ts`                    | fonctions `toXxx(api)`                                      |
| Modèle UI        | `<name>.model.ts`                     | `interface <Name>`                                          |
| Modèle API       | `<name>.api-model.ts`                 | `interface <Name>Api` (suffixe `Api` = forme JSON du back)  |
| Routes           | `<feature>.routes.ts`                 | `<FEATURE>_ROUTES`                                          |
| Guard / Resolver | `<name>.guard.ts` / `.resolver.ts`    | `<name>Guard: CanActivateFn`                                |
| Interceptor      | `<name>.interceptor.ts`               | `<name>Interceptor: HttpInterceptorFn`                      |
| Pipe / Directive | `<name>.pipe.ts` / `.directive.ts`    | `<Name>Pipe` / `<Name>Directive`, sélecteur `sh`-préfixé    |
| Test             | `<name>.spec.ts` (à côté du fichier)  | —                                                           |
| Token            | dans `core/config`                    | `API_BASE_URL = new InjectionToken<string>('API_BASE_URL')` |

Fichiers en kebab-case. Pas de suffixe `Impl`, pas de `Manager`/`Helper`.

## Commandes

- `npm start` (`ng serve`, proxy `/api` vers `http://localhost:3000` via `proxy.conf.json`), `npm run build`, `npm test` (Vitest ; `-- --no-watch` en CI), `npm run lint`, `npm run format` / `format:check`, `npm run deps:check` (dependency-cruiser), `npm run e2e` (Playwright).
- Tests : les requêtes HTTP non simulées font échouer le test (`onUnhandledFrame: 'error'` dans `src/test-setup.ts` ; MSW 3 a renommé `onUnhandledRequest`).

## Templates de code

Squelettes TypeScript valides dans `instructions/templates/`, à copier/renommer puis adapter. Ils sont **exclus du build/lint/test** (`tsconfig` : `exclude: ["instructions/templates"]`).

| Artefact                       | Template                                         |
| ------------------------------ | ------------------------------------------------ |
| Page routée                    | `templates/page.component.template.ts`           |
| Composant de présentation      | `templates/presentational-component.template.ts` |
| Composant graphique (Chart.js) | `templates/chart.component.template.ts`          |
| Composant formulaire           | `templates/form.component.template.ts`           |
| Service API                    | `templates/api.service.template.ts`              |
| Mapper API → UI                | `templates/mapper.template.ts`                   |
| Service d'état (signals)       | `templates/state-service.template.ts`            |
| Routes d'une feature           | `templates/routes.template.ts`                   |
| Guard fonctionnel              | `templates/guard.template.ts`                    |
| Interceptor HTTP               | `templates/http-interceptor.template.ts`         |
| Pipe                           | `templates/pipe.template.ts`                     |
| Directive                      | `templates/directive.template.ts`                |
| Test de composant              | `templates/component.spec.template.ts`           |
| Test de service                | `templates/service.spec.template.ts`             |
| Handlers MSW                   | `templates/msw-handlers.template.ts`             |
| Spec E2E                       | `templates/e2e.spec.template.ts`                 |
| Page object E2E                | `templates/page-object.template.ts`              |

## Libs candidates (non retenues à ce jour)

Remplacer un choix ci-dessus exige l'accord de l'utilisateur. Pistes : `date-fns` (dates), Transloco (i18n, si besoin), NgRx SignalStore (état complexe), Storybook (catalogue de composants).
