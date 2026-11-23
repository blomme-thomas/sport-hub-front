# Fonctionnalités

## Implémentées

- **Tableau de bord** (`dashboard`) : volume d'entraînement (séances et durée) par semaine ou par mois, répartition par type, variation par rapport à la période précédente, modale d'agrandissement. Statut : implémentée (issue #7) ; test e2e du parcours à écrire. Parcours : [Consulter le tableau de bord](parcours/consulter-tableau-de-bord.md).
- **Objectifs** (`goals`) : liste des objectifs répartis en à venir, passés et sans date ; création, modification et suppression (après confirmation) ; événements avec type, format, date et temps cible (heures, minutes, secondes). Statut : implémentée (issue #9) ; tests unitaires et composants livrés, test e2e de la création d'un événement écrit. Progression vers l'objectif : hors périmètre. Parcours : [Gérer les objectifs et événements](parcours/gerer-objectifs-et-evenements.md).
- **Disponibilités** (`creneaux`) : calendrier semaine des créneaux libres et occupés, ponctuels ou hebdomadaires ; création par sélection sur la grille ou par formulaire, modification et suppression (toute la série), navigation entre les semaines. Statut : implémentée (issue #8) ; tests unitaires et composants livrés, test e2e de la création écrit. Génération de séances à partir des créneaux : hors périmètre. Parcours : [Gérer les créneaux de disponibilité](parcours/gerer-creneaux-disponibilite.md).

- **Fiche de séance** (`seances`) : modules dans l’ordre avec durée, consigne, zones cibles et effort visé ; édition des durées et consignes, réordonnancement, ajout et suppression de modules ; séance réalisée en lecture seule. Statut : implémentée (issue #10) ; tests unitaires et composants livrés, test e2e écrit. Parcours : [Consulter et modifier une séance](parcours/consulter-et-modifier-une-seance.md).
- **Nutrition** (`nutrition`) : entrée « Nutrition » du menu et page à deux onglets, « Mes recettes » et « Mes aliments » ; l’onglet choisi est dans l’URL (`?onglet=aliments`) et survit au rechargement. Statut : menu et page livrés (issue #155) ; base d’aliments livrée (issue #156, voir [Consulter et gérer la base d’aliments](parcours/gerer-base-aliments.md)) ; recettes en consultation livrées (issue #157, voir [Lister et consulter les recettes](parcours/consulter-recettes.md)) ; création et modification des recettes livrées (issue #158, voir [Créer et modifier une recette](parcours/creer-et-modifier-recette.md)) ; bascule du calendrier livrée (issue #159, voir [Basculer le calendrier](parcours/basculer-calendrier.md)) ; placement des recettes dans le calendrier livré (issue #160, voir [Placer des recettes dans le calendrier](parcours/placer-recettes-calendrier.md)) ; liste de courses et suite à venir (issues #161 à #163). Tests unitaires et e2e de l’accès et de la base écrits.

## Domaines prévus (source : `CLAUDE.md`, `instructions/11`) :

| Domaine                   | Description prévue                                   | Statut      |
| ------------------------- | ---------------------------------------------------- | ----------- |
| Activités (`activities`)  | Visualisation des activités Garmin                   | non démarré |
| Charge (`load`)           | Visualisation de la charge d'entraînement            | non démarré |
| Récupération (`recovery`) | Visualisation de la récupération                     | non démarré |
| Séances (`workouts`)      | Gestion des entraînements planifiés / générés par IA | non démarré |

Écrans : `/` (tableau de bord, voir le parcours), `/goals` (objectifs, voir le parcours), `/creneaux` (disponibilités, voir le parcours ; bascule Séances / Alimentation, voir le parcours [Basculer le calendrier](parcours/basculer-calendrier.md)), `/nutrition` (nutrition : menu et page à deux onglets « Mes recettes » et « Mes aliments », contenu en cours de livraison), fiche de séance, ouverte en modale depuis le calendrier et le tableau de bord (voir le parcours), `/parametres` (cible hebdomadaire de la semaine, voir le parcours du tableau de bord). Les autres écrans sont à compléter.
