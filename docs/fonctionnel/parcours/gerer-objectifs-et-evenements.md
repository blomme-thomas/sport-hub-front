# Gérer les objectifs et événements

> Statut : implémenté (issue #9). Tests unitaires et composants livrés (mapper, API, état, formulaire, liste, page). Test e2e de la création d'un événement écrit (`e2e/tests/goals/goals.spec.ts`), exécution non vérifiée dans cette passe de documentation. Progression vers l'objectif et compte à rebours sur le tableau de bord : hors périmètre.

## But

Créer, modifier et supprimer ses objectifs, en particulier les événements sportifs (format, date et temps cible), et voir séparément ceux qui sont à venir, ceux qui sont passés et ceux sans date.

## Point d'entrée

- Route `/goals`, chargée en lazy (`features/goals/goals.routes.ts`). Titre de page : « Objectifs ».
- Lien « Objectifs » dans la barre de navigation du shell (`core/layout/shell.component.html`).
- Utilisateur unique, sans authentification.

## Étapes

1. Ouvrir `/goals` (ou cliquer sur « Objectifs »). La page affiche le titre, le bouton « Nouvel objectif » et le chargement de la liste.
2. Lire les trois sections : « À venir », « Passés », « Sans date ». Chacune est toujours affichée ; une section vide porte son propre message (« Aucun objectif à venir. », etc.).
3. Créer un objectif : « Nouvel objectif » ouvre un formulaire dans une modale (titre « Nouvel objectif »).
   - Saisir le titre (obligatoire, 200 caractères au maximum).
   - Choisir le type : « Événement » (par défaut), « Volume » ou « Régularité ».
   - Saisir la date (facultative, sélecteur au format `fr-FR`).
   - Pour un événement seulement : choisir le format (« Sprint », « Olympique », « Half (semi-distance) », « Full (distance complète) », « Autre ») et saisir le temps cible en heures, minutes et secondes.
   - Cliquer sur « Enregistrer ». La modale se ferme, un message « Objectif créé. » apparaît, et la liste est rechargée.
4. Modifier un objectif : bouton « Modifier » de la ligne (nom accessible « Modifier <titre> »). La même modale s'ouvre, titre « Modifier l’objectif », pré-remplie. Le format, la date, le temps cible et les autres champs sont modifiables à tout moment. Enregistrer affiche « Objectif modifié. ».
5. Supprimer un objectif : bouton « Supprimer » de la ligne (nom accessible « Supprimer <titre> »). Une confirmation « Supprimer cet objectif ? » s'ouvre, avec le texte « Cette action est définitive. ». « Annuler » ne fait rien ; « Supprimer » supprime l'objectif et affiche « Objectif supprimé. ».
6. Fermer la modale d'édition sans enregistrer : bouton « Annuler » du formulaire, croix de la modale.

## Règles d'affichage et de saisie

- **Ligne d'un objectif** : titre, puis un résumé séparé par « · » qui reprend le type, le format (pour un événement), la date au format `JJ/MM/AAAA` et le temps cible au format `H h M min S s`, quand ces valeurs existent.
- **Temps cible** : trois champs (heures, minutes, secondes). Trois champs vides, ou tous à zéro, signifient « pas de temps cible ». Le temps est envoyé en secondes totales.
- **Format et temps cible** : envoyés uniquement pour un type « Événement ». Si un objectif passe de « Événement » à « Volume » ou « Régularité », le format et le temps cible sont effacés (envoyés à `null`).
- **Date** : facultative. Un objectif sans date est classé dans « Sans date ».
- **Répartition** : un objectif est « À venir » si sa date est aujourd'hui ou plus tard, « Passés » si elle est antérieure à aujourd'hui. Le « jour courant » est le jour UTC (voir « Limites connues »). L'ordre de la liste est celui renvoyé par le back, c'est-à-dire par date croissante, sans date en dernier.
- **Validation** : le formulaire n'empêche pas un temps cible négatif ni une date invalide ; c'est le back qui tranche (voir « Erreurs »).

## États

- **Chargement** (premier chargement, puis rechargement après une écriture) : zone de contenu en `aria-busy="true"`. Les dernières données restent affichées pendant un rechargement.
- **Vide** (aucun objectif) : message « Aucun objectif pour l’instant. Créez votre premier objectif. ». Les trois sections restent affichées, chacune avec son message vide.
- **Erreur de chargement** (échec de `GET /api/goals`) : le contenu est remplacé par un bloc `role="alert"` affichant le message utilisateur de l'API, et un bouton « Réessayer ». Titre et bouton « Nouvel objectif » restent visibles.
- **Erreur d'écriture** (échec de création, modification ou suppression) : voir « Erreurs ». La liste n'est pas rechargée.

## Erreurs renvoyées par le back

- Une erreur de validation (`VALIDATION_FAILED`) est rattachée au champ concerné, sous ce champ, dans le formulaire ouvert. Champs visés : titre, type, date, format, temps cible. Un temps cible négatif apparaît donc sous le groupe « Temps cible ».
- Une erreur sans champ (par exemple `GOAL_INVALID`) est listée dans un bloc `role="alert"` en tête du formulaire.
- Un objectif introuvable (`GOAL_NOT_FOUND`) n'a pas de champ : le message s'affiche en alerte, dans le formulaire ouvert.
- Pour une suppression, l'erreur n'a pas de formulaire où s'afficher : seul le message de l'intercepteur (toast) est visible.
- Une erreur de validation est donc aussi notifiée par un toast générique (« Certaines informations saisies sont invalides. »). Cette double notification est assumée (voir `docs/technique/integration-api.md`).
- Les messages par code sont dans `core/http/error-messages.ts` (`GOAL_INVALID`, `GOAL_NOT_FOUND`, `GOAL_TARGET_TIME_INVALID`).

## Accessibilité

- Chaque section est une `<section>` nommée par son titre (« À venir », « Passés », « Sans date »). Elle contient une liste quand elle n'est pas vide, sinon son message.
- Chaque bouton « Modifier » et « Supprimer » a un nom accessible qui inclut le titre de l'objectif.
- Pour le titre et la date, l'erreur de champ est reliée au champ par `aria-describedby`. Pour les autres champs (type, format, temps cible), le lien n'est pas encore posé.

## Limites connues

- **Jour courant : UTC côté back et côté front, date locale côté formulaire.** Le back classe « à venir » sur le jour UTC (`upcoming=true`). Le front fait de même pour la répartition (`new Date().toISOString()`, dans `data-access/goals.state.ts`). En revanche, le formulaire enregistre la date choisie avec le calendrier local (`getFullYear`, `getMonth`, `getDate`, dans `goal-form.component.ts`). Pendant les premières heures du jour, en fuseau local en avance sur UTC (par exemple en France, de minuit à une ou deux heures selon l'heure d'été), la répartition peut donc différer du jour local : un objectif daté de la veille locale peut apparaître « À venir ». Cette incohérence est signalée ; elle n'est pas corrigée dans cette story.
- **Date de référence figée** : le « jour courant » est calculé au moment où la liste est chargée ou modifiée. Une page laissée ouverte au-delà de minuit ne reclasse pas les objectifs tant que la liste n'est pas rechargée (`reload`, ou une écriture).

## Hors périmètre

Progression vers l'objectif, compte à rebours sur le tableau de bord, lecture d'un objectif seul (`GET /api/goals/:id`, non utilisé par le front), filtre `upcoming` de l'API (non utilisé : la répartition est faite côté front).
