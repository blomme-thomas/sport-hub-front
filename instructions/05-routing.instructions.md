---
description: 'Routing : routes lazy par feature, guards et resolvers fonctionnels, paramètres liés aux inputs.'
applyTo: '**/*.routes.ts,**/*.guard.ts,**/*.resolver.ts,src/app/app.config.ts'
---

# Routing

Squelettes : `templates/routes.template.ts`, `templates/guard.template.ts` (`11`).

## Règles

- Chaque feature expose `<feature>.routes.ts` (export `const <FEATURE>_ROUTES: Routes`) et est chargée dans `app.routes.ts` via `loadChildren: () => import(...).then(m => m.X_ROUTES)`.
- Page isolée : `loadComponent`.
- Activer `withComponentInputBinding()` : les paramètres de route/query arrivent dans des `input()` du composant (`id = input.required<string>()`), pas via `ActivatedRoute.snapshot`.
- Guards/resolvers **fonctionnels** (`CanActivateFn`, `ResolveFn`) ; pas de classes.
- Fournir un store de feature au niveau de la route : `providers: [ActivityState]`.
- Titre de page via la propriété `title` de la route.
- Route inconnue → page `NotFound` (`**`) en dernier.
- Pas de logique d'auth (usage local).
- Préchargement : `withPreloading(PreloadAllModules)` acceptable vu la taille réduite de l'app.
