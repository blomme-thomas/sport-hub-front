# Commenter une activité réalisée

> Statut : implémenté (issue #15). Tests unitaires et composants livrés (mapper, état, bloc de commentaire). Test e2e de la génération et de la régénération écrit (`e2e/tests/dashboard-details/commentaire-activite.spec.ts`).

## But

Savoir ce qui a été bien ou mal fait sur une activité réalisée, par rapport à la séance prévue. Le commentaire est généré une fois, stocké, et régénéré seulement à la demande.

## Point d'entrée

- Détail d'une activité, ouvert par un clic sur une ligne de la carte « Détails par séance » du tableau de bord (`features/dashboard/components/activity-detail-modal/activity-detail-modal.component.ts`).

## Étapes

1. Ouvrir le détail d'une activité réalisée.
2. Lire le bloc « Commentaire », placé sous les métriques : le texte, sa source (« Généré par l’IA » ou « Commentaire générique (aucune séance rapprochée) ») et la date de génération.
3. Si l'activité n'a pas de commentaire, cliquer sur « Générer le commentaire ».
4. Pour remplacer le commentaire, cliquer sur « Régénérer », puis confirmer avec « Confirmer la régénération ». « Annuler » ferme la confirmation sans rien changer.

## Règles

- La lecture (`GET /api/activities/:id/comment`) ne fait jamais d'appel au modèle : elle renvoie le commentaire stocké.
- Une activité sans commentaire (404) est un état normal qui propose de le générer, pas une erreur.
- La génération (`POST /api/activities/:id/comment`) remplace le commentaire existant et enregistre la nouvelle date.
- Une activité sans séance rapprochée reçoit un commentaire générique, généré sans appel au modèle.
- Une réponse reçue pour une autre activité que celle ouverte est ignorée.

## États

- **Chargement** : « Chargement… » tant que le commentaire est lu.
- **Vide** : « Aucun commentaire pour cette activité. » avec le bouton « Générer le commentaire ».
- **Génération en cours** : « Génération en cours… ». Les boutons d'action sont désactivés.
- **Erreur** : bloc `role="alert"` avec le message de l'API et un bouton « Réessayer ». Une erreur de génération n'efface pas l'état précédent.

## Accessibilité

- Le bloc est une `section` nommée par son titre « Commentaire ».
- Le statut de génération est annoncé (`role="status"`) et la zone porte `aria-busy` pendant le chargement ou la génération.

## Limites connues

- Le commentaire n'est pas affiché dans la carte « Détails par séance » ; il n'est visible que dans le détail de l'activité.
- Pas de bilan hebdomadaire ici : c'est la story suivante.
