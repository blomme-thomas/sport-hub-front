# Consulter les détails des dernières séances

> Statut : implémenté (issue #57). Tests unitaires et composants livrés (formatage, ligne de séance, carte, modale). Test e2e de l'ouverture du détail écrit (`e2e/tests/dashboard-details/details-par-seance.spec.ts`).

## But

Voir d'un coup d'œil les dernières séances réalisées, avec leur fréquence cardiaque, et ouvrir le détail complet d'une activité.

## Point d'entrée

- Carte « Détails par séance » sur le tableau de bord (`features/dashboard/components/recent-activities-card.component.ts`).

## Étapes

1. Lire la liste : chaque ligne donne le titre de la séance, le jour (« Aujourd'hui », « Hier », jour de la semaine, puis date), la durée (« 45 min » ou « 1h 05 »), la distance en km, et la FC moyenne au-dessus d'une courbe de FC.
2. Cliquer sur une ligne : une modale « Détail de la séance » s'ouvre avec toutes les métriques de l'activité.
3. Dans la modale : type, date et heure de début, durée, distance, dénivelé positif, calories, FC moyenne et maximale, temps par zone de FC (zones non vides seulement), et la courbe de FC pendant l'activité.

## Règles

- La courbe de FC de chaque ligne vient du détail de l'activité, chargé pour cette ligne seulement.
- Une séance sans série de FC affiche « — » à la place de la courbe.
- Une valeur absente (distance, dénivelé, calories, FC) s'affiche « — » dans la modale.

## États

- **Chargement** : « Chargement… » pour la liste et pour la modale.
- **Erreur** : bloc `role="alert"` avec le message de l'API et un bouton « Réessayer ».
- **Vide** : « Aucune séance récente ».

## Accessibilité

- Chaque ligne est un bouton dont le nom décrit la séance et le jour.
- La courbe de FC a un nom accessible (« Fréquence cardiaque, <titre> »).

## Limites connues

- Une ligne charge le détail de son activité : quatre requêtes pour quatre séances.
- Les activités synchronisées avant l'ajout de la série de FC n'ont une courbe qu'après une nouvelle synchronisation.
