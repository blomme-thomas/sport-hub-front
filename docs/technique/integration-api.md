# Intégration de l'API sport-hub-back

> Statut : conventions cibles (`instructions/04`), aucun appel implémenté. Ne pas recopier les endpoints : le contrat fait foi côté back (Swagger/OpenAPI).

## Principes

- Seuls `features/*/data-access/` et `core/http` appellent `HttpClient`.
- URL de base via le token `API_BASE_URL` (`core/config`), alimenté par `environment`. Pas d'URL en dur.
- Un service API par ressource (`<name>.api.ts`), types API (`*.api-model.ts`) distincts des modèles UI, convertis par un mapper pur (`<name>.mapper.ts`).
- Pas d'authentification, donc pas d'intercepteur de token.
- Erreurs : intercepteur `core/http/error.interceptor.ts` normalisant en `AppError` + message ng-zorro (`NzMessageService`). Chaque écran de données gère chargement, vide, erreur, succès.
- Lecture pilotée par signal : `httpResource`/`resource`; écriture : méthode retournant un `Observable`.
- Mocks : MSW partagé entre tests unitaires, E2E et dev.

## Endpoints consommés par feature

À compléter.

## Génération de types depuis l'OpenAPI du back

À compléter (non décidé).
