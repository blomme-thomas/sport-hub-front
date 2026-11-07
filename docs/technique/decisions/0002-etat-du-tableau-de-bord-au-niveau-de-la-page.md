# ADR 0002 : état du tableau de bord fourni au niveau de la page

## Statut

Accepté (issue #7).

## Contexte

La page du tableau de bord et la modale d'agrandissement affichent les mêmes statistiques. La modale ne doit faire aucun appel au back à l'ouverture, et la granularité (Semaine / Mois) est modifiable depuis la page comme depuis la modale.

## Décision

- `DashboardState` (`features/dashboard/data-access/dashboard.state.ts`) est fourni par `DashboardPage` (`providers`), et non à la racine. Il porte la granularité (signal, défaut `week`) et une `resource` qui recharge les statistiques à chaque changement de granularité.
- `ChartModalComponent` injecte ce même état via l'injecteur de la page. Il n'injecte ni `HttpClient` ni `TrainingStatsApi`.
- Les couleurs des graphiques viennent de variables CSS, lues au moment de la construction des options Chart.js (`readCssVar`, `shared/utils/css-var.ts`). Aucune valeur hexadécimale n'est écrite dans le TypeScript de la feature.

## Conséquences

- Une requête `GET /api/stats` par chargement de la page et par changement de granularité. Ouvrir la modale n'en déclenche aucune.
- Un service racine n'est pas utilisé : les statistiques ne sont consommées que par cette page. Si une autre feature devait les lire, cette décision serait à revoir.
- Les variables CSS sont lues une fois à la construction des options : un changement de thème à chaud ne met pas à jour les graphiques existants.
