# Glucides et hydratation d'une séance

> Statut : implémenté (issue #162). Tests unitaires et composants livrés (règles du groupe, champs partagés, création, modification). Tests e2e de la création (calendrier) et de la modification (fiche) écrits. Import JSON des séances : story #163.

## But

Indiquer, pour une séance, la cible de glucides (et son unité) et l'hydratation visée pour la séance entière.

## Point d'entrée

- Création : bouton « Nouvelle séance » du calendrier, section « Nutrition » du formulaire.
- Modification : bouton « Modifier la séance » de la fiche de séance, même section.

## Étapes

1. Ouvrir le formulaire de création ou de modification.
2. Renseigner, si on le souhaite, les **glucides** (grammes, entier de 1 à 1000) et leur **unité** : « Par heure » ou « Pour la séance ».
3. Renseigner, si on le souhaite, l'**hydratation** (millilitres, entier de 1 à 20000), pour la séance entière.
4. Enregistrer. En modification, la valeur enregistrée est affichée à l'ouverture.

## Règles

- Les glucides et leur unité se renseignent ensemble ou pas du tout : « Renseignez les glucides et leur unité ensemble. ».
- Une valeur vide reste absente. En modification, vider un champ l'efface sur la séance.
- Les glucides concernent la séance (pendant l'effort) ; pas de cible journalière.
- Les autres nutriments ne sont pas saisis ici.
