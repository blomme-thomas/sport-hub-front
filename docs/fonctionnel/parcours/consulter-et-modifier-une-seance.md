# Consulter et modifier une séance

> Statut : implémenté (issue #10). Tests unitaires et composants livrés (mapper, état, liste des modules, page). Test e2e du parcours d'édition et de la lecture seule écrit (`e2e/tests/seances/seances.spec.ts`), exécution non vérifiée dans cette passe de documentation. Glisser-déposer sur le calendrier, création de séance et journal des modifications : hors périmètre.

## But

Ouvrir une séance planifiée pour voir tout ce qu'il faut faire pendant la séance (modules dans l'ordre, durées, consignes, zones cibles), et la corriger : changer une durée ou une consigne, réordonner les modules, en ajouter ou en supprimer. Une séance réalisée s'affiche en lecture seule.

## Point d'entrée

- Route `/seances/:id`, chargée en lazy (`features/seances/seances.routes.ts`). Le paramètre `id` est l'identifiant de la séance (`GET /api/sessions/:id`). Titre de page : « Séance ».
- Pas encore de lien depuis le tableau de bord ni depuis un calendrier : la fiche s'ouvre par son adresse. Les points d'entrée viendront avec les stories de calendrier (#18) et de planning.
- Utilisateur unique, sans authentification.

## Étapes

1. Ouvrir `/seances/:id`. La page affiche le libellé de la discipline (ou sa clé si le référentiel ne la connaît pas), la date, l'heure de début si elle existe, et le statut (« Planifiée », « Réalisée » ou « Manquée »).
2. Lire les informations : durée prévue, matériel, points d'attention, description.
3. Lire les modules, dans l'ordre. Chaque module indique son type, sa durée, sa consigne, ses zones cibles (« FC 160–170 · Allure 290–310 ») et son effort visé (« Effort visé : 7/10 »).
4. Modifier un module : changer son type, sa durée ou sa consigne dans les champs de la ligne.
5. Réordonner : « Monter » et « Descendre » déplacent le module d'un rang. Le premier ne peut pas monter, le dernier ne peut pas descendre.
6. Ajouter un module : « Ajouter un module » crée une ligne en fin de liste (type « Séries », 10 min, consigne vide à compléter). Jusqu'à 30 modules.
7. Supprimer un module : « Supprimer » retire la ligne du brouillon.
8. Enregistrer : « Enregistrer les modifications » envoie la liste complète des modules. Le bouton n'est actif que si la saisie a changé et qu'elle est valide. Au succès, la séance est remplacée par la réponse du back, le message « Séance modifiée. » apparaît et la mention « Modifiée » s'affiche dans l'en-tête.
9. Annuler : « Annuler les modifications » rétablit la liste enregistrée.

## Règles d'affichage et de saisie

- **Brouillon** : les modifications restent locales tant qu'elles ne sont pas enregistrées. Rien n'est envoyé au back avant « Enregistrer les modifications ».
- **Durée d'un module** : nombre entier de minutes, de 1 à 1440. Hors bornes, la ligne est signalée en rouge et l'enregistrement est bloqué.
- **Consigne** : obligatoire (texte non vide après retrait des espaces), 2000 caractères au plus. Les espaces en début et en fin sont retirés à l'envoi.
- **Type** : « Échauffement », « Éducatifs », « Séries », « Retour au calme » ou « Autre ».
- **Zones cibles et effort visé** : affichés, jamais modifiés dans cette fiche. Ils sont renvoyés tels quels à l'enregistrement, donc conservés.
- **Mention « Modifiée »** : affichée quand le back a enregistré une modification à la main (`modifiedManually`).
- **Total** : le titre de la liste indique le nombre de modules et la somme de leurs durées.

## États

- **Chargement** : « Chargement… », tant que la séance n'est pas reçue.
- **Erreur de chargement** (séance introuvable, par exemple) : bloc `role="alert"` avec le message de l'API et un bouton « Réessayer ».
- **Lecture seule** (séance réalisée) : bandeau « Séance réalisée : elle est affichée en lecture seule. », aucun champ, aucun bouton d'édition.
- **Enregistrement en cours** : le bouton « Enregistrer les modifications » est désactivé.

## Erreurs renvoyées par le back

- Une séance réalisée modifiée entre-temps, ou une modification d'une séance réalisée, renvoie `SESSION_ALREADY_COMPLETED` (409). Le message « Cette séance est réalisée : elle ne peut plus être modifiée. » s'affiche sous les boutons, et le brouillon est conservé.
- Une erreur de validation (`VALIDATION_FAILED` ou `SESSION_MODULE_INVALID`) est aussi notifiée par un toast générique (double notification assumée, voir `docs/technique/integration-api.md`).
- Les messages par code sont dans `core/http/error-messages.ts` (`SESSION_*`).

## Accessibilité

- La liste des modules est une `<ol>` nommée « Modules de la séance ».
- Chaque champ a un libellé associé (« Type », « Durée (min) », « Consigne »). Les boutons de la ligne portent le numéro du module dans leur nom accessible (« Monter le module 2 »).
- La mention de lecture seule est un `role="status"`. Les erreurs d'enregistrement sont un `role="alert"`.
- Le numéro de rang est masqué aux lecteurs d'écran : la position est donnée par l'ordre de la liste.

## Modifier la durée depuis le calendrier (story #11)

Sur la grille du calendrier (`/creneaux`), une séance planifiée porte un bouton « Durée » dans l'angle de sa vignette. Il ouvre la modale « Modifier la durée » (minutes, de 1 à 1440). « Enregistrer » envoie `PATCH /api/sessions/:id` avec `{ durationMinutes }` et affiche « Durée modifiée. ». Pour une séance hebdomadaire, la nouvelle durée s'applique à toute la série. En cas d'erreur, le message du back s'affiche et la semaine est rechargée : la durée d'origine revient à l'écran.

Une séance réalisée n'a pas ce bouton : sa vignette porte la mention « Réalisée, déplacement impossible » et ne se glisse pas. Le back refuse aussi la modification d'une séance réalisée.

## Limites connues

- **Pas de lien vers la fiche** : l'ouverture se fait par l'adresse `/seances/:id`.
- **Libellé de discipline** : chargé depuis `GET /api/disciplines` à l'ouverture. Si ce chargement échoue, la clé brute (par exemple `course_a_pied`) s'affiche.
- **Unités des zones cibles** : les zones sont affichées sans unité (FC, Allure, Puissance), car le contrat ne précise pas l'unité de l'allure et de la puissance. À confirmer avant d'ajouter une unité.
- **Consigne vide à la création** : le module ajouté est invalide tant que sa consigne n'est pas renseignée ; c'est le front qui le bloque, le back n'est pas sollicité.
- **Ordre à l'enregistrement** : la liste complète est renvoyée. Deux onglets modifiant la même séance se remplacent l'un l'autre (le dernier enregistrement gagne), sauf si la séance est devenue réalisée entre-temps (409).

## Hors scope

Glisser-déposer sur le calendrier (story suivante), création de séance, journal des modifications (`changeLog`) affiché, suppression de séance, rapprochement avec une activité Garmin.
