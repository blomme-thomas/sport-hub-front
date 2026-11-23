# Alimentation — cadrage

> Statut : cadrage validé, aucune story créée, aucun code écrit. Ce document garde la trace des décisions prises avant la création des stories.

## Contexte

L'alimentation est ajoutée à sport-hub, dans la même app que les séances, et non dans food-manager (projet séparé, non repris). Le but : préparer les repas de la semaine, voir les recettes par repas sur un calendrier minimaliste, générer une liste de courses pour une période, et associer aux séances des objectifs nutritionnels (glucides, hydratation).

## Décisions

### Périmètre et principes

- Tout reste dans sport-hub. Les calculs (macros, liste de courses) sont faits côté back ; le front n'affiche que le résultat.
- Pas de journal de ce qui est réellement mangé.
- Pas de gestion de stock à domicile.
- Un aliment a une seule unité, sans conversion.
- Pas de contrôle de cohérence sur les recettes ou les macros.
- Provenance des aliments sans importance : la base est alimentée par l'app ou par script.

### Aliments

- Seed initial d'aliments issus de Ciqual, choisis par le développeur, à faire grandir ensuite.
- Valeurs pour 100 g : calories, protéines, glucides, lipides, sucres.
- Une seule unité par aliment.
- Un aliment peut appartenir à plusieurs catégories : protéine, légume, féculent, autre.
- Création et modification d'un aliment depuis l'app. Les champs peuvent être vides au début.

### Recettes

- Modèle de base : protéine, légume, féculent. Chaque composant peut contenir plusieurs aliments de la même famille.
- Quantités par aliment. Les champs peuvent être vides au début.
- Tags de repas : matin, midi, soir, ou une combinaison (midi et soir).
- Petit-déjeuner : sélection libre des ingrédients.

### Navigation et écrans nutrition

- Nouveau menu **Nutrition** dans la navigation, à côté de Tableau de bord, Objectifs, Calendrier et Paramètres.
- Une page Nutrition avec deux onglets : **Mes recettes** (création, modification, consultation) et **Mes aliments** (consultation et gestion de la base).
- Création de recette dans une grande modale, dans le même esprit que la modale de séance : colonne gauche pour la composition (aliments, catégories, quantités), colonne droite pour la synthèse nutritionnelle calculée par le back.
- Depuis l'onglet des recettes, la base d'aliments est accessible sans changer de page.

### Calendrier : un seul calendrier, deux modes

- Pas de calendrier nutrition séparé : le calendrier existant (`/creneaux`) reçoit un sélecteur de mode **Séances / Alimentation**, sur la même URL.
- Mode Séances : fonctionnement actuel, inchangé.
- Mode Alimentation : une semaine, les mêmes jours, trois lignes fixes (matin, midi, soir), sans heures. Les séances ne sont pas affichées dans ce mode. Les recettes sont des cartes, placées par glisser-déposer depuis une bibliothèque de recettes. Plusieurs recettes possibles par repas. Clic sur une recette pour la consulter ou la retirer. Boutons de navigation de semaine et « Aujourd'hui » conservés.

### Planning nutrition

- Une ou plusieurs recettes par repas d'une journée.
- Une recette est un **modèle réutilisable** ; un repas planifié est son utilisation à une date et pour un type de repas donnés. Une même recette peut être placée plusieurs fois, indépendamment.
- Placement par glisser-déposer, sur ordinateur uniquement.

### Liste de courses

- Sélection d'une période par glisser-déposer sur le calendrier, en mode Alimentation.
- Une modale affiche la liste triée par catégorie, avec les quantités calculées par le back.
- La liste n'est ni sauvegardée ni cochable : elle sert à copier-coller pour faire les courses hors de l'app.

### Catégorie « autre »

- Épices, condiments et ingrédients qui pèsent très peu sur les calories et les macros.
- Quantité et macros facultatives.
- Présents dans la liste de courses.

### Nutrition des séances

- Nouvelle section dans la modale de création et de modification d'une séance.
- Champs retenus : **glucides** et **hydratation**, liés à la séance et tous deux facultatifs.
- Les glucides concernent la séance uniquement (pendant l'effort) : cible par heure ou pour la séance, pas de cible journalière.
- Le format d'import `plan-seances` évoluera pour les porter (passage en version 2), dans l'import JSON comme dans la saisie manuelle.
- Import JSON : il prendra en charge les deux nouveaux champs.
- Les stories d'import existantes (front #132 à #134, back #96 et #98) ne couvrent pas la nutrition et restent en l'état. Les évolutions feront l'objet de nouvelles stories.

### Ordre de développement

1. Base alimentaire (aliments, catégories, seed Ciqual).
2. Recettes, avec calcul des macros côté back.
3. Calendrier en mode Alimentation, avec placement des recettes.
4. Liste de courses par glisser-déposer sur une période.
5. Nutrition des séances (glucides et hydratation dans les formulaires et les imports).

## Hors périmètre pour l'instant

- Journal de consommation réelle.
- Stock à domicile.
- Conversions d'unités.
- Contrôle de cohérence des recettes et des macros.
- Sauvegarde de la liste de courses.
- Génération automatique du planning alimentaire.
- Autres nutriments que glucides et hydratation pour les séances.
- Cible nutritionnelle journalière.

## À faire ensuite

- Créer les stories alimentation, côté back et côté front, une fois le cadrage relu.
- Choisir le découpage en phases (aliments et recettes d'abord, puis planning, liste de courses, nutrition des séances).
