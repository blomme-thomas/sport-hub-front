# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

sport-hub-front est le dashboard Angular de sport-hub : visualisation des données Garmin (activités, charge, récupération) et gestion des entraînements planifiés. Il consomme l'API `sport-hub-back` (NestJS). Usage strictement local, un seul utilisateur, pas d'authentification.

## État actuel

Le socle Angular 22 est initialisé (zoneless, SCSS, Vitest, ng-zorro-antd, ESLint, Prettier, dependency-cruiser, MSW, Playwright) : `npm start`, `npm run build`, `npm test`, `npm run lint`, `npm run deps:check`, `npm run e2e`. Il n'y a pas encore de feature. Les conventions de `instructions/` s'appliquent à tout nouveau fichier.

## Règles de code : `instructions/`

Les bonnes pratiques sont documentées **une notion par fichier** dans `instructions/*.instructions.md` (frontmatter `applyTo` indiquant les chemins concernés, comme les custom instructions GitHub Copilot). **Claude Code ne charge automatiquement que ce fichier (`CLAUDE.md`)** : il ne filtre pas par glob. Avant de créer ou modifier un fichier qui correspond à un des `applyTo` ci-dessous, **ouvrir et suivre le fichier d'instructions associé**.

| #   | Fichier                                           | Notion                                                                                  | Consulter avant de toucher à...                       |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 00  | `00-glossary.instructions.md`                     | Glossaire (smart/dumb, feature, signal, resource…)                                      | En cas de doute sur un terme                          |
| 01  | `01-architecture-and-structure.instructions.md`   | core/shared/features, sens des dépendances                                              | Partout (`**`)                                        |
| 02  | `02-components.instructions.md`                   | Composants standalone, OnPush, inputs/outputs, templates                                | `**/*.component.ts`, `**/*.page.ts`, `**/*.html`      |
| 03  | `03-state-and-signals.instructions.md`            | Signals, services d'état, stores                                                        | `**/*.store.ts`, `**/*.state.ts`, `**/data-access/**` |
| 04  | `04-data-access-and-http.instructions.md`         | HttpClient, services API, mapping, erreurs, interceptors                                | `**/data-access/**`, `src/app/core/http/**`           |
| 05  | `05-routing.instructions.md`                      | Routes lazy, guards, resolvers                                                          | `**/*.routes.ts`, `**/*.guard.ts`                     |
| 06  | `06-forms.instructions.md`                        | Reactive forms typés, validation                                                        | `**/*form*.ts`, `**/*.component.html`                 |
| 07  | `07-rxjs-and-async.instructions.md`               | RxJS vs signals, désabonnement                                                          | `**/*.ts`                                             |
| 08  | `08-styling-ui-and-accessibility.instructions.md` | ng-zorro-antd, thème, Chart.js, SCSS, a11y                                              | `**/*.scss`, `**/*.html`, `**/charts/**`              |
| 09  | `09-testing.instructions.md`                      | Tests unitaires/composants (Vitest, Testing Library, MSW)                               | `**/*.spec.ts`, `src/mocks/**`                        |
| 09b | `09b-e2e-testing.instructions.md`                 | Tests E2E (Playwright)                                                                  | `e2e/**`                                              |
| 10  | `10-code-changes-and-review.instructions.md`      | Méthode de travail et checklist de revue                                                | Toujours, avant/après tout changement                 |
| 11  | `11-repository-conventions.instructions.md`       | **Conventions concrètes du dépôt** (stack, arborescence, nommage, commandes, templates) | Toujours — cité par tous les autres comme « `11` »    |

Squelettes de code prêts à copier : `instructions/templates/*.template.ts` — table Artefact → Template dans `11`.

## Repères rapides (détail dans `11`)

- Stack : Angular (dernière stable), TypeScript strict, ng-zorro-antd (Ant Design), Chart.js, Vitest + Testing Library + MSW, Playwright.
- Toujours : composants **standalone**, `ChangeDetectionStrategy.OnPush`, **signals** (`signal`/`computed`/`input()`/`output()`), `inject()`, control flow `@if/@for/@switch`, routes **lazy**.
- Organisation : `src/app/{core,shared,features/<feature>}` ; une feature n'importe jamais une autre feature.
- Le front ne contient **pas de logique métier Garmin** : il affiche ce que l'API renvoie (mapping API → modèle UI dans `data-access`).
- Avant tout changement : suivre la démarche de `10`.
