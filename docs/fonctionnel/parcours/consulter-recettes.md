# Lister et consulter les recettes

> Statut : implémenté (issue #157). Tests unitaires et composants livrés (mapper, filtres, état, carte, consultation, panneau). Test e2e du filtrage et de la consultation écrit (`e2e/tests/nutrition/recettes.spec.ts`). Création et modification : story #158.

## But

Voir sa bibliothèque de recettes en cartes, avec les valeurs nutritionnelles calculées par le back, filtrer par repas et ouvrir une recette en lecture seule.

## Point d'entrée

- Route `/nutrition`, onglet « Mes recettes » (par défaut). L'onglet est dans l'URL (`?onglet=recettes`).
- Composant `features/nutrition/components/recipes-panel`, fourni par la page Nutrition.

## Étapes

1. Ouvrir l'onglet « Mes recettes ». Les recettes se chargent ; pendant le chargement, « Chargement des recettes… ».
2. Lire les cartes : nom, repas (Matin, Midi, Soir), puis kcal, protéines (P), glucides (G) et lipides (L) pour la recette. Tant que la synthèse d'une carte n'est pas chargée, « Synthèse en cours… ».
3. Rechercher : le champ « Rechercher une recette » filtre sur le nom, sans tenir compte de la casse.
4. Filtrer par repas : les puces « Toutes », « Matin », « Midi », « Soir » affichent leur nombre de recettes. Une recette compte dans chacun de ses repas. La recherche et le repas se combinent.
5. Ouvrir une recette : cliquer sur la carte (nom accessible « Ouvrir la recette <nom> »). Une modale affiche les valeurs nutritionnelles de la recette, puis sa composition par composant (Protéine, Légume, Féculent, Libre) avec le nom de chaque aliment et sa quantité.
6. La modale est en lecture seule, sans bouton d'enregistrement.

## Règles

- Aucun total n'est recalculé côté front : kcal, protéines, glucides et lipides viennent de `GET /api/recipes/:id`.
- La liste `GET /api/recipes` ne porte pas la synthèse ; l'écran charge donc le détail de chaque recette au chargement de l'onglet, en parallèle. C'est un coût d'appels proportionnel au nombre de recettes. Une synthèse dans la liste côté back réduirait ces appels.
- Les éléments sans quantité ou sans valeur nutritionnelle sont exclus du total ; la consultation indique combien.
- Un aliment absent de la base affiche « Aliment inconnu ».
- Les recettes n'ont pas d'image : la maquette la prévoit, le back ne la fournit pas.
