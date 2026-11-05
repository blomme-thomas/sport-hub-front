---
description: 'Accès aux données : services API, HttpClient, resource, mapping DTO API -> modèle UI, erreurs, interceptors.'
applyTo: '**/data-access/**/*.ts,src/app/core/http/**/*.ts,src/app/core/config/**/*.ts'
---

# Accès aux données et HTTP

Squelettes : `templates/api.service.template.ts`, `templates/mapper.template.ts`, `templates/http-interceptor.template.ts` (`11`).

## Règles

- Seuls les fichiers de `data-access/` (et `core/http`) appellent `HttpClient`. Un composant n'injecte jamais `HttpClient`.
- Un service API par ressource (`activities.api.ts`) : méthodes fines, une par endpoint, typées `Observable<ApiXxx>` ou exposées via `httpResource`.
- **L'URL de base** vient d'un token `API_BASE_URL` (`core/config`), alimenté par l'`environment` ; jamais d'URL en dur.
- **Séparer les types** : `ActivityApi` (forme JSON du back, `models/*.api.ts`) ≠ `Activity` (modèle UI). Un **mapper** pur (`activity.mapper.ts`) convertit ; les dates ISO deviennent des `Date`, les unités sont normalisées une seule fois ici.
- Le back est la source de vérité du contrat. Si le contrat change, mettre à jour `*.api.ts` et le mapper, pas les templates.
- Pas d'auth (usage local) : aucun intercepteur de token.

## Chargement

- Lecture déclenchée par un signal (paramètre de route, filtre) → `httpResource` / `resource` (le rechargement est automatique quand le signal change).
- Écriture / action utilisateur → méthode du service retournant un `Observable`, souscrite via `firstValueFrom` ou le `subscribe` du store (jamais dans un template).
- Pas de `subscribe` imbriqués ; composer avec les opérateurs RxJS (`07`).

## Erreurs

- Un intercepteur fonctionnel (`core/http/error.interceptor.ts`) normalise les erreurs HTTP en `AppError` et notifie (`NzMessageService`).
- Le composant n'affiche que l'état `error` du store/resource ; aucun `try/catch` dispersé.
- Gérer explicitement : chargement, vide, erreur, succès — dans tous les écrans de données.

## Configuration

`provideHttpClient(withInterceptors([...]))` dans `app.config.ts` ; fetch activé (`withFetch()`).
