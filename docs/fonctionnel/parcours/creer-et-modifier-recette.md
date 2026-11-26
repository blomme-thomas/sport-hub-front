# Créer et modifier une recette

> Statut : implémenté (issue #158). Tests unitaires et composants livrés (formulaire, panneau). Test e2e de la création écrit (`e2e/tests/nutrition/creer-recette.spec.ts`). Notes libres sur la recette : hors périmètre, le back ne les porte pas.

## But

Composer une recette dans une grande modale : son nom, ses repas, ses aliments par composant et leurs quantités. Voir sa synthèse nutritionnelle calculée par le back, et la modifier.

## Point d'entrée

- Onglet « Mes recettes » de `/nutrition` : bouton « Nouvelle recette ».
- Depuis la consultation d'une recette (voir [Lister et consulter les recettes](consulter-recettes.md)) : bouton « Modifier la recette ».

## Étapes

1. « Nouvelle recette » ouvre une modale. Deux colonnes : la composition à gauche, la synthèse à droite.
2. Saisir le nom (200 caractères au plus, obligatoire) et cocher au moins un repas (Matin, Midi, Soir).
3. Composer par composant : « Protéine », « Légume », « Féculent » et « Autre (optionnel) ». Pour chaque ligne, « Ajouter un aliment » crée une ligne ; choisir l'aliment dans la liste, puis saisir sa quantité si elle est connue.
   - Un composant ne propose que les aliments de sa famille (un aliment à plusieurs catégories apparaît dans chacune).
   - La section « Autre » propose tous les aliments, sans composant (ex. petit-déjeuner).
4. « Enregistrer » crée la recette. La modale se ferme, « Recette ajoutée. » s'affiche et la liste est rechargée : les cartes montrent les totaux calculés par le back.
5. Modifier : depuis la consultation, « Modifier la recette » ouvre la même modale pré-remplie. La composition enregistrée remplace l'ancienne ; « Recette modifiée. » s'affiche.
6. Importer : « Importer (JSON) » dans l'onglet « Mes recettes » ouvre une modale. Déposer un fichier `plan-recettes` (ou un tableau brut de recettes). Chaque item désigne son aliment par son nom, qui doit correspondre à un seul aliment de la base. Le contenu part tel quel à `POST /api/recipes/import` ; en cas de succès, « N recette(s) importée(s). » s'affiche et la liste se recharge. Un fichier refusé (aliment introuvable, nom déjà existant) reste dans la modale avec les erreurs du back.

## Règles

- Une ligne sans aliment bloque l'enregistrement : « Choisissez un aliment, ou retirez la ligne. ».
- Une quantité doit être supérieure à 0 si elle est saisie ; une quantité vide est acceptée.
- Une recette sans quantité est acceptée : ses valeurs sont exclues du total, et la synthèse l'indique.
- La synthèse n'est affichée qu'après l'enregistrement : la recette n'a pas encore de totaux tant qu'elle n'est pas enregistrée.
- Les erreurs du back s'affichent près du champ concerné (nom, repas), ou en alerte si elles ne visent aucun champ.
- Aucun total n'est recalculé côté front.
- Suppression d'une recette : hors périmètre de cette story.
