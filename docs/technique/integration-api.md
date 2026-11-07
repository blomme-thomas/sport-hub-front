# Intégration de l'API sport-hub-back

> Statut : la gestion des erreurs HTTP est livrée (`core/http`). Aucun endpoint n'est encore appelé par une feature (« Endpoints consommés par feature » : à compléter). Ne pas recopier les endpoints : le contrat fait foi côté back (Swagger/OpenAPI).

## Principes

- Seuls `features/*/data-access/` et `core/http` appellent `HttpClient`.
- URL de base via le token `API_BASE_URL` (`core/config`), alimenté par `environment`. Pas d'URL en dur.
- Un service API par ressource (`<name>.api.ts`), types API (`*.api-model.ts`) distincts des modèles UI, convertis par un mapper pur (`<name>.mapper.ts`).
- Pas d'authentification, donc pas d'intercepteur de token.
- Erreurs : un seul point d'entrée, l'intercepteur `core/http/error.interceptor.ts`, qui convertit toute erreur en `AppError` (voir « Gestion des erreurs ») et notifie le message (`NzMessageService`). Aucun écran ne parse une erreur HTTP. Chaque écran de données gère chargement, vide, erreur, succès.
- Lecture pilotée par signal : `httpResource`/`resource`; écriture : méthode retournant un `Observable`.
- Mocks : MSW partagé entre tests unitaires, E2E et dev.

## Gestion des erreurs

Le back répond à toute erreur au format RFC 9457 (`application/problem+json`) avec un `code` stable, un `correlationId` (aussi dans l'en-tête `X-Correlation-Id`) et, pour une validation, `errors[]` (`{ field, code, message }`). Le contrat détaillé est dans `sport-hub-back/docs/technique/erreurs-api.md`. Les types de la forme JSON (`ProblemDetailsApi`, `FieldErrorApi`) sont écrits à la main dans `core/http/problem-details.api-model.ts` ; ils suivent ce fichier, sans génération depuis l'OpenAPI.

Flux :

1. `HttpClient` échoue ; `errorInterceptor` (enregistré dans `app.config.ts`) appelle `toAppError(err)` (`core/http/problem-details.mapper.ts`).
2. `toAppError` produit une `AppError` (`core/http/app-error.ts`) : `code`, `status`, `detail`, `fieldErrors`, `correlationId`, `userMessage`. Il ne lève jamais d'exception. Un corps qui n'est pas `application/problem+json` valide (HTML d'un proxy, corps vide) donne `INVALID_RESPONSE`.
3. L'intercepteur affiche toujours `userMessage` (`NzMessageService`), puis relance l'`AppError`.
4. Un formulaire rattache les erreurs de validation à ses champs avec `applyFieldErrors(form, error)` (`core/http/apply-field-errors.ts`).

Une erreur de validation est donc notifiée deux fois, assumé : un toast (`userMessage`, par exemple « Certaines informations saisies sont invalides. ») et un message sous chaque champ fautif.

Cas hors contrat (codes internes, `status` 0 pour le réseau) :

| Code               | Cas                                                             |
| ------------------ | --------------------------------------------------------------- |
| `NETWORK_ERROR`    | pas de réponse (`status` 0)                                     |
| `TIMEOUT`          | `TimeoutError` RxJS, ou statut 408 / 504                        |
| `INVALID_RESPONSE` | réponse non `problem+json` valide (HTML d'un proxy, corps vide) |
| `UNKNOWN`          | erreur qui n'est pas une erreur HTTP                            |

Message utilisateur : celui du code (`ERROR_MESSAGES`), ou `DEFAULT_ERROR_MESSAGE` si le code est inconnu. Pour un 5xx ou un code inconnu, le message se termine par `Référence : <correlationId>` quand un identifiant est disponible, afin de faciliter le diagnostic. Le `detail` renvoyé par le back n'est jamais affiché.

### Erreurs de champ

`applyFieldErrors` pose l'erreur `server` sur chaque contrôle visé (chemins `address.street` et `items[0].name` acceptés) et le marque `touched`. Plusieurs messages pour un même champ sont joints par un espace. Le motif d'affichage :

```html
<input
  id="street"
  formControlName="street"
  [attr.aria-describedby]="form.controls.street.errors?.['server'] ? 'street-error' : null"
/>
@if (form.controls.street.errors?.['server']; as message) {
<p id="street-error" role="alert">{{ message }}</p>
}
```

L'erreur serveur disparaît à la prochaine modification du champ. `applyFieldErrors` renvoie les messages des erreurs sans champ correspondant : l'écran doit les afficher à part, car ils ne peuvent pas être rattachés à un champ.

### Ajouter un message pour un code

1. Ajouter une entrée dans `ERROR_MESSAGES` (`core/http/error-messages.ts`), clé = `code` exact renvoyé par le back, valeur = message français destiné à l'utilisateur.
2. Ajouter un test dans `problem-details.mapper.spec.ts` si le code a un comportement particulier.
3. Ne pas mettre de détail technique dans le message : il est affiché tel quel.

Un code absent de `ERROR_MESSAGES` affiche `DEFAULT_ERROR_MESSAGE` sans erreur ; un code ajouté au back doit donc être ajouté ici pour un message précis.

## Endpoints consommés par feature

À compléter.

## Génération de types depuis l'OpenAPI du back

À compléter (non décidé).
