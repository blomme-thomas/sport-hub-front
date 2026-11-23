# Générer la liste de courses d'une période

> Statut : implémenté (issue #161). Tests unitaires et composants livrés (formatage du texte, liste, sélection de période, état). Test e2e du parcours écrit (`e2e/tests/creneaux/liste-courses.spec.ts`). Sauvegarde ou cases à cocher : hors périmètre.

## But

Obtenir, pour une période de la semaine alimentaire, la liste des aliments à acheter, avec leurs quantités, à copier-coller hors de l'application.

## Point d'entrée

- Route `/creneaux`, en mode « Alimentation » (voir [Basculer le calendrier](basculer-calendrier.md)).
- La sélection se fait sur les en-têtes des jours de la grille, sur ordinateur.

## Étapes

1. Glisser sur les en-têtes des jours : de lundi à mercredi, par exemple. Les colonnes choisies sont mises en évidence, et la barre sous la grille indique la période.
2. Cliquer sur « Générer une liste de courses ». Une modale s'ouvre et calcule la liste.
3. Lire la liste : la période en tête, puis les aliments groupés par catégorie (Protéines, Légumes, Féculents, Autres), chacun avec sa quantité.
4. Cliquer sur « Copier » : la liste est placée dans le presse-papiers en texte simple, et « Liste copiée. » s'affiche.
5. Fermer la modale. Rien n'est sauvegardé ni coché.

## Règles

- Les quantités sont calculées par le back : somme des quantités connues sur la période, avec l'unité de l'aliment. Rien n'est recalculé côté front.
- Une ligne dont une occurrence n'a pas de quantité est signalée « à compléter » (la somme connue est affichée à côté). Une ligne sans aucune quantité n'affiche que cette mention ; c'est le cas typique des épices (catégorie « Autres »).
- Une période sans repas planifié affiche « Aucun repas planifié sur cette période. ».
- Changer de semaine efface la sélection.
- Le glisser pour choisir une période est désactivé sur mobile, comme le placement des recettes.
- Le texte copié suit ce modèle : titre, période, puis une ligne `- Aliment : quantité` par aliment, sous son titre de catégorie.
