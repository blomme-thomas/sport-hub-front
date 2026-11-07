# Fonctionnalités

## Implémentées

- **Tableau de bord** (`dashboard`) : volume d'entraînement (séances et durée) par semaine ou par mois, répartition par type, variation par rapport à la période précédente, modale d'agrandissement. Statut : implémentée (issue #7) ; test e2e du parcours à écrire. Parcours : [Consulter le tableau de bord](parcours/consulter-tableau-de-bord.md).
- **Objectifs** (`goals`) : liste des objectifs répartis en à venir, passés et sans date ; création, modification et suppression (après confirmation) ; événements avec type, format, date et temps cible (heures, minutes, secondes). Statut : implémentée (issue #9) ; tests unitaires et composants livrés, test e2e de la création d'un événement écrit. Progression vers l'objectif : hors périmètre. Parcours : [Gérer les objectifs et événements](parcours/gerer-objectifs-et-evenements.md).

## Domaines prévus (source : `CLAUDE.md`, `instructions/11`) :

| Domaine                   | Description prévue                                   | Statut      |
| ------------------------- | ---------------------------------------------------- | ----------- |
| Activités (`activities`)  | Visualisation des activités Garmin                   | non démarré |
| Charge (`load`)           | Visualisation de la charge d'entraînement            | non démarré |
| Récupération (`recovery`) | Visualisation de la récupération                     | non démarré |
| Séances (`workouts`)      | Gestion des entraînements planifiés / générés par IA | non démarré |

Écrans : `/` (tableau de bord, voir le parcours), `/goals` (objectifs, voir le parcours). Les autres écrans sont à compléter.
