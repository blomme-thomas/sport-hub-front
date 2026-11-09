# Gérer les pauses sur le calendrier

> Statut : implémenté (issue #17). Tests unitaires du formulaire et de l'API livrés, test e2e de la création (back simulé) et de la validation des dates. Dépend du back `/api/pauses` (back #43) et du calendrier (story #8).

## But

Suspendre la planification pendant une période donnée (blessure, vacances, autre). Les pauses s'affichent en bandeau au-dessus de la grille, et la génération de planning ne propose aucune séance pendant leur durée (règle du back).

## Point d'entrée

- Bouton « Nouvelle pause » dans l'en-tête de `/creneaux`.
- Les bandeaux de la semaine affichée apparaissent au-dessus de la grille. Une pause qui chevauche la semaine apparaît, même si elle commence avant ou finit après.

## Étapes

1. Cliquer sur « Nouvelle pause ». Les dates sont pré-remplies avec la semaine affichée, le motif « Vacances ».
2. Ajuster le début, la fin et le motif (« Blessure », « Vacances » ou « Autre »).
3. Cliquer sur « Enregistrer ». La pause est créée, le message « Pause créée. » apparaît, et le bandeau s'affiche.
4. Pour modifier : cliquer sur « Modifier » dans le bandeau. Le formulaire se pré-remplit ; l'enregistrement met à jour le bandeau (« Pause modifiée. »).
5. Pour supprimer : cliquer sur « Supprimer » dans le bandeau, puis confirmer. Les séances existantes sont conservées.

## Règles

- **Fin antérieure au début** : signalée sous les dates, et le bouton « Enregistrer » reste inactif. Rien n'est envoyé au back.
- **Suppression** : toujours confirmée par une modale.
- **Modification ou suppression** : les bandeaux se mettent à jour après la réponse du back, en rechargeant la liste de la semaine.

## Erreurs

- Une erreur renvoyée par le back s'affiche dans la modale (`role="alert"`) ; la modale reste ouverte avec les valeurs saisies.
- Une erreur de suppression est notifiée par l'intercepteur ; la liste reste telle quelle.

## Limites connues

- **Création par sélection sur la grille** : non implémentée. La création passe par le bouton et le formulaire, avec la semaine affichée comme période par défaut.

## Hors scope

- Génération de planning pendant la pause (géré côté back).
