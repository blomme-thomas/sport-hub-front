# Basculer le calendrier entre Séances et Alimentation

> Statut : implémenté (issue #159). Tests unitaires et composants livrés (grille alimentation, mode mémorisé). Test e2e de la bascule écrit (`e2e/tests/creneaux/mode-calendrier.spec.ts`). Placement des recettes : story #160.

## But

Voir la semaine sous deux angles sur le même calendrier : les séances, comme aujourd'hui, ou les repas de la semaine.

## Point d'entrée

- Route `/creneaux` (calendrier). Pas de calendrier nutrition séparé.
- Bascule « Séances » / « Alimentation » dans l'en-tête de la page. Le mode actif a `aria-pressed="true"`.

## Étapes

1. Ouvrir `/creneaux` : le mode « Séances » est affiché (fonctionnement habituel, inchangé).
2. Cliquer sur « Alimentation » : la grille change, l'URL ne change pas.
3. Le mode alimentation affiche la semaine courante, avec les mêmes jours que le calendrier des séances, et trois lignes fixes : Matin, Midi, Soir. Aucune heure, aucune séance.
4. Les boutons de navigation de semaine (‹, ›) et « Aujourd’hui » fonctionnent dans les deux modes.
5. Revenir à « Séances » rétablit le calendrier habituel.

## Règles

- En mode alimentation, les actions propres aux séances (nouvelle séance, pause, import, génération de planning) et les bannières de pauses sont masquées, ainsi que la légende des séances.
- Le mode choisi est mémorisé pour la session du navigateur (hypothèse à valider) : un rechargement garde le même mode. Sans stockage disponible, le mode revient à « Séances » au rechargement.
- Une erreur de chargement des créneaux s'affiche dans les deux modes.
