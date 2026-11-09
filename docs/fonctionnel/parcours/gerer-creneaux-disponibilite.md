# Gérer les créneaux de disponibilité

> Statut : implémenté (issue #8). Tests unitaires et composants livrés (mapper, dates, API, état, formulaire, grille). Test e2e de la création d'un créneau écrit (`e2e/tests/creneaux/creneaux.spec.ts`). Génération de séances, glisser-déposer des séances planifiées et résolution des chevauchements : hors périmètre.

## But

Indiquer ses plages libres et occupées dans un calendrier semaine : créer un créneau ponctuel ou hebdomadaire en sélectionnant une plage sur la grille, le modifier et le supprimer, et naviguer d'une semaine à l'autre.

## Point d'entrée

- Route `/creneaux`, chargée en lazy (`features/creneaux/creneaux.routes.ts`). Titre de page : « Disponibilités ».
- Lien « Disponibilités » dans la barre de navigation du shell (`core/layout/shell.component.html`).
- Utilisateur unique, sans authentification.

## Étapes

1. Ouvrir `/creneaux` (ou cliquer sur « Disponibilités »). La page affiche la semaine du jour, du lundi au dimanche, avec le titre « Semaine du … au … ».
2. Naviguer : « ‹ » et « › » vont à la semaine précédente et suivante, « Aujourd’hui » revient à la semaine du jour.
3. Créer un créneau, de deux façons :
   - **Par sélection** : dans une colonne de jour, cliquer et glisser de haut en bas. La plage sélectionnée apparaît en pointillés. Le pas est de 30 minutes. Un simple clic propose une heure à partir du point cliqué.
   - **Par le bouton** « Nouveau créneau » : le formulaire s'ouvre avec le jour du jour (ou le premier jour de la semaine affichée si le jour du jour n'y est pas), de 09:00 à 10:00.
   - Dans les deux cas, la modale « Nouveau créneau » s'ouvre. Renseigner le type, la date, l'heure de début, l'heure de fin et la récurrence, puis cliquer sur « Enregistrer ». La modale se ferme, le message « Créneau créé. » apparaît et la semaine est rechargée.
4. Modifier un créneau : cliquer sur son bloc dans la grille (nom accessible « <type>, <début> – <fin>[, chaque semaine]. Modifier »). La même modale s'ouvre, titre « Modifier le créneau », pré-remplie. Enregistrer affiche « Créneau modifié. ».
5. Supprimer un créneau : dans la modale de modification, bouton « Supprimer ». Une confirmation « Supprimer ce créneau ? » s'ouvre. « Annuler » ne fait rien ; « Supprimer » supprime le créneau et affiche « Créneau supprimé. ».
6. Fermer la modale sans enregistrer : « Annuler » ou la croix de la modale.

## Règles d'affichage et de saisie

- **Type** : « Libre » (disponible, vert) ou « Occupé » (indisponible, orange). Les créneaux peuvent se chevaucher : ils sont alors affichés côte à côte, sans en masquer aucun.
- **Récurrence** : « Aucune (ponctuel) » (par défaut) ou « Chaque semaine ». Une série hebdomadaire est ancrée à la date saisie, se répète chaque semaine sans date de fin, et porte la mention « Chaque semaine » sur la grille.
- **Heures** : heures murales (`HH:mm`), de 00:00 à 23:59. Une fin doit être postérieure au début : sinon le formulaire affiche « L’heure de fin doit être postérieure à l’heure de début. » sans envoyer la saisie.
- **Modification et suppression d'une série** : elles valent pour toute la série. Le formulaire d'un créneau hebdomadaire le rappelle : « Toute modification ou suppression vaut pour toute la série. ». Il n'existe pas de modification d'une seule occurrence.
- **Fuseau** : les heures restent des heures murales. À la création, le fuseau du navigateur est envoyé au back, où il est seulement stocké (aucun calcul n'en dépend). La modification ne le change pas.

## États

- **Chargement** (premier chargement, changement de semaine, rechargement après une écriture) : zone de la grille en `aria-busy="true"`. Au changement de semaine, la grille est vidée le temps de la réponse.
- **Vide** (aucun créneau sur la semaine) : message « Aucun créneau cette semaine. Sélectionnez une plage dans la grille ou cliquez sur « Nouveau créneau ». ». La grille reste affichée.
- **Erreur de chargement** (échec de `GET /api/slots`) : la grille est remplacée par un bloc `role="alert"` affichant le message utilisateur de l'API, et un bouton « Réessayer ». Le titre, la navigation et « Nouveau créneau » restent visibles.
- **Erreur d'écriture** (création, modification, suppression refusée) : voir « Erreurs ». La semaine n'est pas rechargée.
- **Réponse périmée** : si l'utilisateur change de semaine avant la fin d'un chargement, la réponse de l'ancienne semaine est ignorée.

## Erreurs renvoyées par le back

- Une erreur de validation (`VALIDATION_FAILED`) est rattachée au champ concerné, sous ce champ, dans le formulaire ouvert. Champs visés : type, date, heure de début, heure de fin, récurrence.
- Une erreur sans champ (par exemple `SLOT_END_NOT_AFTER_START`) est listée dans un bloc `role="alert"` en tête du formulaire.
- Une erreur de validation est aussi notifiée par un toast générique (« Certaines informations saisies sont invalides. ») : double notification assumée (voir `docs/technique/integration-api.md`).
- Les messages par code sont dans `core/http/error-messages.ts` (`SLOT_INVALID`, `SLOT_END_NOT_AFTER_START`, `SLOT_PERIOD_INVALID`, `SLOT_PERIOD_TOO_LARGE`, `SLOT_NOT_FOUND`).

## Accessibilité

- La grille est une région « Grille de la semaine ». Chaque colonne est un groupe nommé par la date complète (« mardi 10 novembre 2026 »).
- Chaque créneau est un bouton dont le nom décrit le type, les heures et la récurrence. Il se parcourt et s'ouvre au clavier.
- La sélection à la souris n'a pas d'équivalent clavier dans la grille : le bouton « Nouveau créneau » et le formulaire le remplacent.
- Le lien entre un message d'erreur de date et le champ n'est pas posé : le sélecteur de date ne transmet pas `aria-describedby` à son champ de saisie. Les autres champs sont reliés à leur erreur.
- La légende (« Libre », « Occupé ») repose aussi sur le texte, pas seulement sur la couleur.

## Limites connues

- **Pas de glisser-déposer des créneaux existants** : seule la création se fait par sélection sur la grille. Déplacer un bloc se fait en le modifiant.
- **Chevauchements non résolus** : aucune règle n'arbitre entre un créneau libre et un créneau occupé qui se chevauchent.
- **Jour courant en heure locale** : le jour par défaut et la semaine affichée utilisent la date locale du navigateur. Le calcul est donc cohérent avec le formulaire, à la différence des objectifs (voir `gerer-objectifs-et-evenements.md`).
- **Date de référence figée** : la semaine affichée au chargement de la page ne change pas au passage de minuit tant que l'utilisateur ne navigue pas.

## Hors périmètre

Génération de séances à partir des créneaux (story à venir), déplacement de séances planifiées, modification d'une seule occurrence d'une série, fin de récurrence, vue mois.

## Séances sur le calendrier (issue #46)

La page `/creneaux`, intitulée « Calendrier », affiche aussi les séances de la semaine :

- Chaque séance avec une heure apparaît dans la case de son jour, à son heure de début, sur la durée prévue. Les séances sans heure ne sont pas placées sur la grille.
- Une séance porte l'icône et la couleur de sa discipline (correspondance dans `models/discipline-style.ts`). Une discipline absente de la correspondance s'affiche avec une icône neutre. Les clés correspondent au référentiel alimenté par Garmin ; à confirmer sur les données réelles.
- La légende liste les disciplines présentes sur la semaine, avec leur libellé.
- Un clic sur une séance ouvre sa fiche (`/seances/:id`). La création, le déplacement et la modification au clic des séances viennent avec les stories #47 à #49.
- Les données viennent de `GET /api/sessions?from&to` (occurrences) et de `GET /api/disciplines`.
