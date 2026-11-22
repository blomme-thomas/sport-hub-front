# Générer le planning depuis le calendrier

> Statut : implémenté (issue #12). Tests unitaires de l'API et test e2e de la génération d'une semaine (back simulé) livrés. Dépend du back `POST /api/planning/generate` (back #39) et du calendrier (story #8).

## But

Demander au back de remplir les créneaux libres de la période choisie avec des séances, sans les saisir une à une. Le planning généré s'affiche dans le calendrier ; les séances existantes restent inchangées.

## Point d'entrée

- Bouton « Générer le planning » dans l'en-tête de la page `/creneaux`, à côté de « Nouvelle séance ».
- Utilisateur unique, sans authentification.

## Étapes

1. Cliquer sur « Générer le planning ». La modale charge les événements (objectifs de type événement ayant une date cible).
2. Choisir la période :
   - **Cette semaine** : du premier jour de la semaine affichée au dimanche.
   - **Jusqu’à la fin du mois** : du premier jour de la semaine affichée au dernier jour de son mois.
   - **Jusqu’à un événement** : du premier jour de la semaine affichée jusqu’à la date cible de l’événement choisi. Le bouton « Générer » reste inactif tant qu’aucun événement n’est choisi.
3. Cliquer sur « Générer ». Le calendrier est figé pendant l’appel (clics, glisser-déposer et boutons de la page inactifs).
4. Au succès, la modale se ferme, le message « N séance(s) générée(s). » apparaît (ou « Aucune séance générée : pas de créneau libre sur la période. ») et la semaine est rechargée.

## Règles

- **Période passée** : si la fin de la période (date de fin, ou date cible de l’événement) est antérieure à aujourd’hui, la génération est refusée sans appel au back, avec le message « Impossible de générer un planning sur une période passée. ». Le back écarte de toute façon les jours passés.
- **Séances existantes** : le back ne modifie pas les séances déjà réalisées ou modifiées ; elles restent affichées telles quelles.

## Erreurs

- Une erreur renvoyée par le back s'affiche dans la modale (`role="alert"`). La modale reste ouverte et l'état du calendrier n'est pas perdu : la semaine n'est pas rechargée.
- Si la liste des événements ne se charge pas, son erreur s'affiche à la place de la liste ; les options « Cette semaine » et « Jusqu’à la fin du mois » restent utilisables.

## Hors scope

- Affichage de la fiche d'une séance générée (story fiche, #10).
- Choix du nombre de séances ou de la discipline avant génération.
