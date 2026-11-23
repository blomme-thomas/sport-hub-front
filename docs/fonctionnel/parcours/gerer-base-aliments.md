# Consulter et gérer la base d'aliments

> Statut : implémenté (issue #156). Tests unitaires et composants livrés (mapper, filtres, état, tableau, formulaire, panneau). Test e2e de la création et du filtrage écrit (`e2e/tests/nutrition/base-aliments.spec.ts`).

## But

Voir les aliments de la base avec leurs valeurs pour 100 g, les rechercher, les filtrer par catégorie, et en ajouter ou modifier.

## Point d'entrée

- Route `/nutrition`, onglet « Mes aliments » (`/nutrition?onglet=aliments`). L’onglet choisi est dans l’URL.
- Composant `features/nutrition/components/foods-panel`, fourni par la page Nutrition.

## Étapes

1. Ouvrir l'onglet « Mes aliments ». La base se charge ; pendant le chargement, « Chargement des aliments… ».
2. Lire le tableau : nom et unité, catégories, calories, protéines, glucides et lipides pour 100 g. Une valeur vide s'affiche « — ».
3. Rechercher : le champ « Rechercher un aliment » filtre sur le nom, sans tenir compte de la casse.
4. Filtrer par catégorie : les puces « Tous », « Protéines », « Légumes », « Féculents », « Autres » affichent leur nombre d'aliments. La recherche et la catégorie se combinent.
5. Ajouter : « Ajouter un aliment » ouvre une modale. Saisir le nom (200 caractères au plus), l'unité (20 caractères au plus) et au moins une catégorie. Les valeurs nutritionnelles sont facultatives. « Enregistrer » ajoute l'aliment et affiche « Aliment ajouté. ».
6. Modifier : bouton « Modifier » de la ligne (nom accessible « Modifier <nom> »). La modale est pré-remplie. Vider une valeur la remet à vide ; « Enregistrer » affiche « Aliment modifié. ».

## Règles

- Un aliment peut porter plusieurs catégories ; il compte dans chacune pour les compteurs.
- Les erreurs du back s'affichent près du champ concerné, ou en alerte si elles ne visent aucun champ.
- Suppression d'un aliment : hors périmètre (dépend de la décision sur les recettes qui l'utilisent).
- Pas de conversion d'unité : une valeur est toujours pour 100 g de l'unité de l'aliment.
