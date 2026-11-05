---
description: 'Glossaire des termes Angular/front utilisés dans les instructions (source de vérité des termes).'
applyTo: '**'
---

# Glossaire

| Terme                               | Définition dans ce dépôt                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Feature**                         | Dossier `features/<feature>/` regroupant tout ce qui concerne un domaine d'écran (activities, load, recovery, workouts). Lazy-loadée. |
| **Page (smart component)**          | Composant routé d'une feature. Injecte les services/stores, lit l'état, passe les données aux composants de présentation.             |
| **Presentational component (dumb)** | Composant sans injection de service métier : reçoit via `input()`, émet via `output()`. Réutilisable et testable seul.                |
| **Data-access**                     | Dossier `data-access/` d'une feature : services API, stores/états, mappers. Seul endroit qui parle HTTP.                              |
| **API model / DTO API**             | Forme JSON renvoyée par `sport-hub-back` (`*.api.ts`). Jamais utilisée directement dans les templates.                                |
| **Model (UI)**                      | Type TypeScript consommé par les composants (`models/*.model.ts`), produit par un mapper depuis le DTO API.                           |
| **Signal**                          | Primitive réactive synchrone (`signal`, `computed`, `effect`, `linkedSignal`). État par défaut.                                       |
| **Resource**                        | API asynchrone basée sur signals (`resource`, `rxResource`, `httpResource`) pour charger des données.                                 |
| **State service / Store**           | Service `providedIn: 'root'` ou fourni par route qui détient un état en signals (ou NgRx SignalStore si justifié).                    |
| **Core**                            | `src/app/core/` : singletons applicatifs (config, interceptors, layout, erreurs globales).                                            |
| **Shared**                          | `src/app/shared/` : composants/pipes/directives/utilitaires génériques sans dépendance vers une feature.                              |
| **Page object**                     | Classe E2E (Playwright) encapsulant les sélecteurs et actions d'une page.                                                             |
| **MSW handler**                     | Définition d'une réponse simulée de l'API, partagée entre tests unitaires, E2E et dev.                                                |
