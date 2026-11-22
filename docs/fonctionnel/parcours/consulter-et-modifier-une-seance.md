# Consulter et modifier une séance

> Statut : implémenté (issue #10). Tests unitaires et composants livrés (mapper, état, liste des modules, page). Test e2e du parcours d'édition et de la lecture seule écrit (`e2e/tests/seances/seances.spec.ts`), exécution non vérifiée dans cette passe de documentation. Glisser-déposer sur le calendrier, création de séance et journal des modifications : hors périmètre.

## But

Ouvrir une séance planifiée pour voir tout ce qu'il faut faire pendant la séance (modules dans l'ordre, durées, consignes, zones cibles), et la corriger : changer une durée ou une consigne, réordonner les modules, en ajouter ou en supprimer. Une séance réalisée s'affiche en lecture seule.

## Point d'entrée

- Ouverture en modale (`SessionModalService`), depuis le calendrier et le tableau de bord ; il n'y a pas de route dédiée. La fiche reçoit l'identifiant de la séance et la charge (`GET /api/sessions/:id`). Titre de la modale : le titre de la séance, à défaut sa discipline.
- Utilisateur unique, sans authentification.

## Étapes

1. Cliquer sur une séance du calendrier ou du tableau de bord. La fiche affiche le libellé de la discipline (ou sa clé si le référentiel ne la connaît pas), la date, l'heure de début si elle existe, et le statut (« Planifiée », « Réalisée » ou « Manquée »).
2. Lire les informations : durée prévue, matériel, points d'attention, description.
3. Lire les modules, dans l'ordre. Chaque module indique son type, sa durée, sa consigne, ses zones cibles (« FC 160–170 · Allure 290–310 ») et son effort visé (« Effort visé : 7/10 »).
4. Modifier un module : changer son type, sa durée ou sa consigne dans les champs de la ligne.
5. Réordonner : glisser un module par sa poignée (⋮⋮) et le déposer à la position voulue. Seule la poignée permet de glisser, pour que les champs restent utilisables.
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
- Chaque champ a un libellé associé (« Type », « Durée (min) », « Consigne »). La poignée de glisser est masquée aux lecteurs d’écran ; le bouton de suppression porte le numéro du module dans son nom accessible (« Supprimer le module 2 »).
- La mention de lecture seule est un `role="status"`. Les erreurs d'enregistrement sont un `role="alert"`.
- Le numéro de rang est masqué aux lecteurs d'écran : la position est donnée par l'ordre de la liste.

## Modifier la durée depuis le calendrier (story #11)

Sur la grille du calendrier (`/creneaux`), une séance planifiée porte un bouton « Durée » dans l'angle de sa vignette. Il ouvre la modale « Modifier la durée » (minutes, de 1 à 1440). « Enregistrer » envoie `PATCH /api/sessions/:id` avec `{ durationMinutes }` et affiche « Durée modifiée. ». Pour une séance hebdomadaire, la nouvelle durée s'applique à toute la série. En cas d'erreur, le message du back s'affiche et la semaine est rechargée : la durée d'origine revient à l'écran.

Une séance réalisée n'a pas ce bouton : sa vignette porte la mention « Réalisée, déplacement impossible » et ne se glisse pas. Le back refuse aussi la modification d'une séance réalisée.

## Objectifs et activité réalisée (story #62)

**Création** : le formulaire de création (`/creneaux`) comporte une section « Objectifs ». La distance cible est facultative (en km). La répartition cible par zone de FC (Z1 à Z5, en %) est obligatoire et doit totaliser exactement 100 % ; le total est affiché sous les champs. Les erreurs ne s'affichent qu'après une tentative de création. Les valeurs partent dans `targetDistanceMeters` et `targetHrZonePercentages`.

**Fiche** : la section « Objectifs » montre la distance cible et la répartition cible. Une fois une activité liée, elle ajoute les taux distance et durée, plafonnés à 100 % à l'affichage, et l'écart par zone en points, signé, avec la couleur de la zone.

**Activité réalisée** : la section « Activité réalisée » liste les activités du même jour, de la même discipline (type Garmin égal à la clé de la séance), avec « Associer » pour chacune. Une activité liée affiche sa distance, sa durée, sa FC moyenne et son origine (rapprochée automatiquement ou associée manuellement), avec « Dissocier ». Associer passe la séance en réalisée (`PUT /api/sessions/:id/activity`).

**Limites de cette story** :

- **Dissocier ne repasse pas la séance en prévue** : le back conserve le statut « réalisée » (`DELETE /api/sessions/:id/activity`). Le critère initial demandait le retour en prévue ; à trancher côté back.
- **Pas de rapprochement automatique depuis la fiche** : le bouton « Rapprocher automatiquement » pour la semaine affichée n'est pas livré.
- **Pas de taux de distance sur le calendrier** : la liste des occurrences ne renvoie pas `achievement` ; le repère de réalisation sur la grille reste celui de la mention « Réalisée ».
- **Jour et discipline** : le jour est lu en UTC, et la discipline de la séance est comparée au type Garmin de l'activité (même clé).

## Commentaire de l’activité réalisée (story #15)

Sous « Activité réalisée », un bloc « Commentaire » apparaît dès qu’une activité est liée à la séance.

- **Affichage** : le commentaire est rendu en markdown (titres, listes, gras, liens). Il indique sa source (« Saisi à la main », « Généré par l’IA » ou « Commentaire générique ») et sa date.
- **Sans commentaire** : le bloc indique « Aucun commentaire pour cette activité » et propose « Ajouter un commentaire ». Cet état est normal, pas une erreur.
- **Modifier** : un champ de saisie markdown s’ouvre, avec un aperçu rendu sous le champ. « Enregistrer » appelle `PUT /api/activities/:id/comment` et remplace le commentaire. « Annuler » ferme la saisie sans rien enregistrer.
- **Enregistrer** reste désactivé tant que le texte est vide. En cas d’échec, le message s’affiche sous le champ et le texte saisi est conservé.
- **Génération par l’IA** : non branchée côté front (`AI_FEATURES_ENABLED = false`). Aucun bouton de génération ni de régénération n’apparaît.

**Limites de cette story** :

- **Pas d’historique** : chaque enregistrement remplace le commentaire précédent.
- **Pas de limite de longueur** côté front ni côté back pour la saisie manuelle.
- **Pas de notification pour l’absence de commentaire** : l’intercepteur HTTP affiche un message à chaque erreur, y compris le 404 normal d’une activité sans commentaire. Le traitement de ce cas reste à faire dans l’intercepteur partagé.

## Export de la séance avec son activité (story #123)

Quand une activité est liée à la séance, le bloc « Activité réalisée » propose « Exporter la séance (JSON) ».

- **Clic** : le fichier renvoyé par `GET /api/exports/sessions/:id` est téléchargé tel quel, sans transformation côté front.
- **Nom du fichier** : `seance-<date de la séance>-<identifiant>.json`, par exemple `seance-2026-11-12-session-course.json`.
- **Pendant le téléchargement** : le bouton affiche « Téléchargement… » et reste désactivé.
- **Erreur** (réseau, 404) : le message est affiché par l'intercepteur HTTP partagé ; l'écran reste en place.
- **Sans activité liée** : le bouton n'apparaît pas.

## Limites connues

- **Libellé de discipline** : chargé depuis `GET /api/disciplines` à l'ouverture. Si ce chargement échoue, la clé brute (par exemple `course_a_pied`) s'affiche.
- **Unités des zones cibles** : les zones sont affichées sans unité (FC, Allure, Puissance), car le contrat ne précise pas l'unité de l'allure et de la puissance. À confirmer avant d'ajouter une unité.
- **Consigne vide à la création** : le module ajouté est invalide tant que sa consigne n'est pas renseignée ; c'est le front qui le bloque, le back n'est pas sollicité.
- **Ordre à l'enregistrement** : la liste complète est renvoyée. Deux onglets modifiant la même séance se remplacent l'un l'autre (le dernier enregistrement gagne), sauf si la séance est devenue réalisée entre-temps (409).

## Hors scope

Glisser-déposer sur le calendrier (story suivante), création de séance, journal des modifications (`changeLog`) affiché, suppression de séance, rapprochement automatique depuis la fiche (voir « Objectifs et activité réalisée »).

## Modifier une séance depuis un fichier JSON (story #134)

Sur une séance planifiée, « Modifier la séance » ouvre une fenêtre avec les champs date, heure de début, durée, discipline et description. Une zone permet de glisser-déposer un fichier `.json`, au format `plan-seances` (version 1) contenant **une seule** séance.

1. Un JSON valide pré-remplit les champs présents dans le fichier et remplace les modules du brouillon. Rien n'est enregistré à ce stade. Les champs absents (heure, description) gardent leur valeur actuelle.
2. Un JSON invalide affiche chaque erreur avec son chemin, par exemple `seances[0].modules[1].durationMinutes`, et ne modifie pas le formulaire.
3. « Enregistrer » envoie `PATCH /api/sessions/:id` avec les champs du formulaire (une heure ou une description vides sont envoyées `null`), puis `PUT /api/sessions/:id/modules` si le fichier a fourni des modules. Une fois la séance enregistrée, la fenêtre se ferme et « Séance modifiée. » s'affiche.

Une séance réalisée n'a pas le bouton « Modifier la séance ». La discipline de la séance reste proposée même si elle a disparu du référentiel.

Code : `features/seances/components/session-edit-form/`, état `SessionState.saveDetails`, validation partagée `shared/plan-seances/`.
