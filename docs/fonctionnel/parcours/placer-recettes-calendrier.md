# Placer des recettes dans le calendrier alimentaire

> Statut : implémenté (issue #160). Tests unitaires et composants livrés (grille, bibliothèque, fiche, état des repas). Tests e2e du glisser-déposer, de la consultation, du retrait et du mobile écrits (`e2e/tests/creneaux/placer-recettes.spec.ts`). Le retrait se fait par la croix de la carte, sans confirmation ni message. Génération automatique du planning : hors périmètre.

## But

Composer la semaine alimentaire en plaçant des recettes dans les cases du calendrier, matin, midi ou soir, puis consulter ou retirer un repas placé.

## Point d'entrée

- Route `/creneaux`, en mode « Alimentation » (voir [Basculer le calendrier](basculer-calendrier.md)).
- La bibliothèque « Mes recettes » s'affiche sous la grille.

## Étapes

1. Sur ordinateur, glisser une recette de la bibliothèque dans une case (jour, repas). La recette est placée : elle apparaît dans la case. Une recette n'est pas acceptée dans un repas qui n'est pas prévu pour elle (une recette « midi et soir » ne va pas le matin) : la case ne se colore pas et le dépôt est refusé.
2. Plusieurs recettes peuvent être placées dans la même case, et une même recette peut être placée plusieurs fois, indépendamment.
3. Cliquer sur le nom d'une recette placée ouvre sa fiche : le jour et le repas, les valeurs nutritionnelles de la recette (calculées par le back), et la liste des aliments.
4. La croix à droite de la carte retire ce seul repas planifié ; les autres placements de la même recette ne bougent pas.
5. Sur mobile, le glisser-déposer est désactivé : la bibliothèque affiche « Le placement se fait sur ordinateur. Vous pouvez consulter une recette placée. ». La consultation et le retrait restent possibles.

## Règles

- Une case de la semaine affichée reçoit les repas planifiés de cette semaine (ISO, du lundi au dimanche) ; changer de semaine recharge la liste.
- Une case survolée pendant un glissement est mise en évidence.
- Une recette retirée de la bibliothèque n'efface pas les repas déjà placés : elle apparaît sous « Recette inconnue » tant qu'elle existe dans le back.
- Les totaux de la fiche viennent du back ; rien n'est recalculé côté front.
- Le placement n'est pas accessible au clavier dans cette version : seul le glisser-déposer est prévu par la story.
- Génération automatique du planning, cases multiples avec ordre : hors périmètre.
