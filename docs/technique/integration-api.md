# Intégration de l'API sport-hub-back

> Statut : la gestion des erreurs HTTP est livrée (`core/http`). Deux features consomment l'API : `dashboard`, avec `GET /api/stats` et `GET /api/goals`, et `goals`, avec `GET`, `POST`, `PATCH` et `DELETE /api/goals` (voir « Endpoints consommés par feature »). Ne pas recopier les endpoints : le contrat fait foi côté back (Swagger/OpenAPI).

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

### `dashboard`

| Méthode | Chemin       | Appelé par                                                                      | Rôle                                          |
| ------- | ------------ | ------------------------------------------------------------------------------- | --------------------------------------------- |
| GET     | `/api/stats` | `TrainingStatsApi.get` (`features/dashboard/data-access/training-stats.api.ts`) | Volume d'entraînement par semaine ou par mois |
| GET     | `/api/goals` | `NextEventApi.list` (`features/dashboard/data-access/next-event.api.ts`)        | Bloc « Prochain événement »                   |

- Paramètres envoyés : `granularity` (`week` ou `month`), `from` et `to` (`YYYY-MM-DD`, UTC), calculés par `DashboardState` sur une plage glissante de 8 semaines ou 6 mois. Le tableau de bord n'envoie pas `type`.
- Chargement : une `resource` dans `DashboardState`, relancée à chaque changement de granularité. `toDashboardView` (`training-stats.mapper.ts`) convertit la réponse en vue d'affichage : conversions seulement (secondes en heures, libellés, texte signé, `null` en « n/a »).
- Erreurs : `AppError` produite par `toAppError` (voir « Gestion des erreurs »). L'intercepteur la notifie, et l'écran affiche le message avec « Réessayer ».
- Contrat : règles et route dans `sport-hub-back/docs/technique/contextes/training-stats.md` et Swagger du back. Non recopiés ici.
- Mock MSW : `src/mocks/handlers/training-stats.handlers.ts`.

### `goals`

- `GET /api/goals` : `GoalsApi.list` (`features/goals/data-access/goals.api.ts`). Liste de tous les objectifs.
- `POST /api/goals` : `GoalsApi.create`. Création d'un objectif.
- `PATCH /api/goals/:id` : `GoalsApi.update`. Modification, corps complet envoyé.
- `DELETE /api/goals/:id` : `GoalsApi.delete`. Suppression.

- Le front n'envoie pas le filtre `upcoming` : une seule liste est chargée, puis répartie dans `goal.mapper.ts` (`partitionGoals`) entre « À venir », « Passés » et « Sans date », sur le jour UTC courant. Le back applique la même règle pour `upcoming=true` (`list-goals.use-case.ts`).
- Le back expose aussi `GET /api/goals/:id`. Le front ne l'appelle pas.
- Corps d'écriture : `toCreateRequest` pour la création, `toUpdateRequest` pour la modification (même forme). Le format et le temps cible sont envoyés à `null` si le type n'est pas `evenement`, ce qui évite à la modification un échec `GOAL_INVALID` quand un événement passe à un autre type. Le temps cible est envoyé en secondes totales (`null` si nul ou absent).
- Mapping : `GoalApi` → `Goal` (`toGoal`), le temps cible devient `{ hours, minutes, seconds }`. Les types API sont dans `goal.api-model.ts`.
- Chargement : `GoalsState` (fourni au niveau de la page) appelle `list()` à sa création et après chaque écriture réussie. Il convertit les observables en promesses avec `firstValueFrom`, et ne suit pas le principe « `resource` » ci-dessus : écart assumé pour des écritures impératives avec retour du formulaire (à revoir si la feature évolue).
- Erreurs : `AppError` produite par `toAppError`, comme pour le reste de l'application. Les codes `GOAL_INVALID` (400, sans `errors[]`), `GOAL_NOT_FOUND` (404) et `GOAL_TARGET_TIME_INVALID` (400) ont un message dans `ERROR_MESSAGES`. Côté back, `GOAL_TARGET_TIME_INVALID` n'est pas renvoyé par les routes à ce jour (la validation de transport répond `VALIDATION_FAILED` avant) ; son message n'est donc qu'une garde.
- Erreurs de champ : `VALIDATION_FAILED` avec `errors[]` sur `title`, `type`, `targetDate`, `eventFormat`, `targetTimeSeconds`. Le groupe `targetTimeSeconds` du formulaire reçoit les erreurs de ce champ, via `applyFieldErrors`. Les erreurs sans champ sont listées en alerte dans le formulaire.
- Contrat : règles et codes dans `sport-hub-back/docs/technique/contextes/objectifs.md` et `sport-hub-back/docs/technique/erreurs-api.md`. Non recopiés ici.
- Mock MSW : `src/mocks/handlers/goals.handlers.ts` (état en mémoire, `*/api/goals`). Fixtures : `src/mocks/fixtures/goals.fixtures.ts`.

### `creneaux`

- `GET /api/slots?from=&to=` : `SlotsApi.list` (`features/creneaux/data-access/slots.api.ts`). Occurrences de la semaine affichée, `from` (lundi) et `to` (dimanche) inclus. Le back développe les séries hebdomadaires ; le front ne calcule aucune récurrence.
- `POST /api/slots` : `SlotsApi.create`. Création, avec le fuseau du navigateur (`timeZone`).
- `PATCH /api/slots/:id` : `SlotsApi.update`. Modification, corps complet envoyé (type, date, heures, récurrence), sans fuseau.
- `DELETE /api/slots/:id` : `SlotsApi.delete`. Suppression de toute la série.
- Mapping : une occurrence est convertie par `toSlot` avec `slotId` comme `id`. Les réponses d'écriture (`SlotApi`, champ `id`) passent par `toSavedSlot`. Les types API sont dans `slot.api-model.ts`.
- Répartition par jour : `SlotsState.days` regroupe les créneaux par date pour les sept jours de la semaine. La disposition des chevauchements est calculée par `layoutDaySlots` (`slot.mapper.ts`), fonction pure et testée.
- Chargement : `SlotsState` (fourni au niveau de la page) charge la semaine à sa création, à chaque changement de semaine et après chaque écriture réussie. Une réponse dont la semaine a été quittée est ignorée. Conversion par `firstValueFrom`, comme pour `goals`.
- Dates : `shared/utils/iso-date.ts` calcule le jour local (`localIsoDate`) et ajoute des jours calendaires sans décalage (`addIsoDays`). Le jour UTC n'est pas utilisé ici.
- Erreurs : `AppError` produite par `toAppError`. Codes `SLOT_END_NOT_AFTER_START`, `SLOT_NOT_FOUND`, `SLOT_INVALID`, `SLOT_PERIOD_*` ont un message dans `ERROR_MESSAGES`. Les erreurs de champ (`VALIDATION_FAILED`, `errors[]`) sont rattachées à `type`, `date`, `startTime`, `endTime`, `recurrence` dans le formulaire ; `timeZone` n'a pas de champ et s'affiche en alerte.
- Contrat : règles et routes dans `sport-hub-back/docs/technique/contextes/creneaux.md`. Non recopiés ici.
- Mock MSW : `src/mocks/handlers/slots.handlers.ts` (état en mémoire, `*/api/slots`, occurrences calculées comme le back). Fixtures : `src/mocks/fixtures/slots.fixtures.ts`. Helper de test : `src/mocks/slots.testing.ts`.

## Génération de types depuis l'OpenAPI du back

À compléter (non décidé).
