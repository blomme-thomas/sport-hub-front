---
description: "Gestion d'état par signals : signal/computed/linkedSignal/resource, services d'état, quand utiliser un store NgRx SignalStore."
applyTo: '**/*.store.ts,**/*.state.ts,**/data-access/**/*.ts'
---

# État et signals

Squelette : `templates/state-service.template.ts` (`11`).

## Hiérarchie des choix

1. **État local d'un composant** → `signal()` dans le composant.
2. **Donnée dérivée** → `computed()`. Jamais dupliquer une donnée dérivée dans un second signal.
3. **État dérivé modifiable** (reset quand la source change) → `linkedSignal()`.
4. **Donnée chargée depuis l'API** → `resource`/`httpResource`/`rxResource` (`04`).
5. **État partagé entre composants d'une feature** → service d'état (`*.state.ts` ou `*.store.ts`) avec signals.
6. **État complexe** (plusieurs entités, actions, persistance, devtools) → NgRx SignalStore (`@ngrx/signals`). À introduire sur besoin réel, pas par défaut.

## Règles

- Un état est **privé en écriture** : exposer `asReadonly()` / des `computed`, les mutations passent par des méthodes nommées (`selectWeek()`, `setFilter()`), pas par `.set()` depuis l'extérieur.
- Mutations immuables : `update(s => ({ ...s, x }))`, pas de mutation en place des objets/tableaux.
- Service d'état : `providedIn: 'root'` seulement s'il est réellement global ; sinon le fournir au niveau de la route (`providers` de la route) pour lui donner la durée de vie de la feature.
- `effect()` interdit pour synchroniser deux états (utiliser `computed`/`linkedSignal`).
- Pas de `BehaviorSubject` pour de l'état nouveau ; si une API Observable existe, la convertir avec `toSignal` (`07`).
- Modéliser l'asynchrone explicitement : `loading` / `error` / `value` (déjà fournis par `resource`), jamais un `null` ambigu.
