# Consulter le bilan hebdomadaire

> Statut : implémenté (issue #16). Tests unitaires et composants livrés (semaine ISO, état, carte). Test e2e de l'affichage et de la génération écrit (`e2e/tests/bilan/bilan.spec.ts`), exécution non vérifiée dans cette passe de documentation.

## But

Lire, sur le tableau de bord, le bilan de la semaine : ce qui a été suivi, un point d'attention et un conseil pour la semaine suivante. Pouvoir revenir sur les semaines précédentes et régénérer un bilan.

## Point d'entrée

- Carte « Bilan de la semaine » en bas du tableau de bord (`features/dashboard/components/weekly-review-card.component.ts`).
- Utilisateur unique, sans authentification.

## Étapes

1. Ouvrir le tableau de bord. La carte affiche la semaine courante, du lundi au dimanche, avec son libellé « Semaine du … au … ».
2. Lire les trois parties : **Suivi**, **Point d’attention**, **Conseil**.
3. Changer de semaine : « ‹ » et « › » vont à la semaine précédente et suivante, « Cette semaine » revient à la semaine courante.
4. Une semaine sans bilan affiche « Aucun bilan pour cette semaine. » et le bouton « Générer le bilan ».
5. Régénérer : le bouton « Régénérer » demande une confirmation (« Régénérer le bilan ? »). Après confirmation, le bilan est remplacé.

## Règles

- Les semaines sont ISO (lundi à dimanche), au format `AAAA-Www`. La carte calcule la semaine avec le jour local du navigateur.
- Une semaine sans séance prévue reçoit un bilan générique : la carte l'indique (« Semaine sans séance prévue : bilan générique. »).
- La date de génération est affichée sous le bilan.
- Lire une semaine ne fait jamais appel au modèle : seule la génération (« Générer le bilan », « Régénérer ») le fait.

## États

- **Chargement** : « Chargement… » tant que le bilan n'est pas reçu.
- **Génération en cours** : « Génération en cours… », et les boutons de génération sont désactivés.
- **Absence de bilan** : état à proposer, pas une erreur (404 côté API).
- **Erreur** (autre que 404) : bloc `role="alert"` avec le message de l'API et un bouton « Réessayer ».

## Erreurs renvoyées par le back

- `WEEKLY_REVIEW_UNAVAILABLE` (503) : génération impossible pour le moment.
- `WEEKLY_REVIEW_ACCESS_DENIED` (502) : le service d'IA refuse la génération.
- `WEEKLY_REVIEW_INVALID_OUTPUT` (502) : bilan incomplet, rien n'est remplacé.
- `WEEKLY_REVIEW_INVALID_WEEK` (400) : semaine invalide.
- Les messages sont dans `core/http/error-messages.ts`.

## Accessibilité

- La carte est un `<article>` nommé « Bilan de la semaine ». Les trois parties sont une liste de définitions (`dt` / `dd`).
- La navigation de semaine est un groupe nommé « Choisir la semaine », avec des libellés explicites pour « ‹ » et « › ».
- Le libellé de la semaine est une région `aria-live`, lue à chaque changement de semaine.

## Limites connues

- **Génération longue** : le bilan est produit par le modèle, la génération peut prendre plusieurs secondes.
- **Dernière date de génération** : affichée dans le fuseau du navigateur.

## Hors scope

Bilan mensuel, historique des versions d'un bilan.
