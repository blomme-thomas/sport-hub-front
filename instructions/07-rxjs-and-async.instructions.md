---
description: 'RxJS vs signals : quand utiliser quoi, interop toSignal/toObservable, désabonnement, anti-patterns.'
applyTo: '**/*.ts'
---

# RxJS et asynchrone

## Quand utiliser quoi

| Besoin                                                           | Outil                                |
| ---------------------------------------------------------------- | ------------------------------------ |
| État, valeur affichée                                            | **signals**                          |
| Requête HTTP ponctuelle                                          | `Observable` du `HttpClient`         |
| Chargement piloté par un signal                                  | `httpResource` / `rxResource` (`04`) |
| Flux d'événements (debounce de recherche, polling, combinaisons) | **RxJS**                             |
| Observable → template                                            | `toSignal(obs$, { initialValue })`   |
| Signal → pipeline RxJS                                           | `toObservable(sig)`                  |

## Règles

- Pas de `subscribe()` manuel dans un composant. Si inévitable : `takeUntilDestroyed(this.destroyRef)`.
- Pas de `async` pipe nouveau : convertir en signal avec `toSignal`.
- Pas de `Subject`/`BehaviorSubject` exposé pour de l'état (`03`).
- Pas de `subscribe` imbriqué : `switchMap` (annulation, recherche), `concatMap` (ordre), `exhaustMap` (anti double-clic), `forkJoin` (requêtes parallèles).
- `debounceTime` + `distinctUntilChanged` pour toute recherche en frappe.
- Pour `async/await` : `firstValueFrom()` sur un observable fini ; ne pas mélanger sans raison.
- Typage strict des opérateurs ; pas de `any` dans les pipes.
