# ADR 0001 : erreurs HTTP normalisées en `AppError` par un intercepteur unique

## Statut

Accepté (issue #2).

## Contexte

Le back renvoie toute erreur en `application/problem+json` avec un `code` stable (voir `sport-hub-back/docs/technique/erreurs-api.md`). Le front doit afficher un message précis, rattacher les erreurs de validation aux champs, et gérer les cas hors contrat (réseau, délai dépassé, réponse d'un proxy). Lire `err.error.message` dans chaque écran ne couvre pas ces cas et duplique la logique.

## Décision

- Un seul point d'entrée : `errorInterceptor` (`core/http/error.interceptor.ts`) appelle `toAppError` (`core/http/problem-details.mapper.ts`), qui produit une `AppError` (`core/http/app-error.ts`). Aucun écran ne parse une erreur HTTP.
- L'intercepteur notifie toujours `userMessage` (`NzMessageService`), puis relance l'`AppError`.
- Les erreurs de validation sont aussi rattachées aux champs par `applyFieldErrors` (`core/http/apply-field-errors.ts`) : double notification assumée (toast et message sous le champ).

## Conséquences

- Un code ajouté au back doit être ajouté dans `ERROR_MESSAGES` (`core/http/error-messages.ts`) pour avoir un message précis ; sinon `DEFAULT_ERROR_MESSAGE` est affiché.
- Les types de la forme JSON sont écrits à la main (`problem-details.api-model.ts`) et doivent suivre le contrat du back.
- Le `detail` du back n'est jamais affiché.
