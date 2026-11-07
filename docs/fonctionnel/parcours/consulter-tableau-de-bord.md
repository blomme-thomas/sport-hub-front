# Consulter le tableau de bord

> Statut : implémenté (issue #7). Tests unitaires livrés (mapper, état, composants, page). Le test e2e du parcours n'est pas encore écrit.

## But

Voir d'un coup d'œil, sur la page d'accueil, le volume d'entraînement (nombre de séances et durée) de la période en cours, sa variation par rapport à la période précédente, et son évolution sur la plage affichée.

## Point d'entrée

- Route `/`, chargée en lazy (`features/dashboard/dashboard.routes.ts`). Titre de page : « Tableau de bord ».
- Utilisateur unique, sans authentification.

## Étapes

1. Ouvrir `/`. La page affiche le titre, la bascule Semaine / Mois (Semaine par défaut) et le chargement des statistiques.
2. Lire les chiffres clés de la période en cours : nombre de séances et durée (en heures), chacun avec sa variation.
3. Lire la note sur la comparaison, puis les trois cartes : séances par période, durée par période, répartition par type (dernière période).
4. Basculer Semaine / Mois : les statistiques sont rechargées, les chiffres et les graphiques sont mis à jour, et une annonce `aria-live` indique la granularité affichée.
5. Agrandir une carte avec son bouton « Agrandir » : une modale affiche le graphique en grand, avec son titre, la bascule de granularité et le tableau des valeurs.
6. Fermer la modale avec le bouton « Fermer » ou la touche Échap.

## Plage de dates et requête

- La plage est glissante et calculée en UTC à partir de la date du jour :
  - Semaine : 8 semaines ISO (lundi au dimanche), la semaine en cours incluse.
  - Mois : 6 mois calendaires, le mois en cours inclus.
- Une seule requête par granularité : `GET /api/stats` avec `granularity`, `from` et `to`. Le tableau de bord n'envoie pas de filtre par type.
- Aucun calcul de statistique côté front : totaux, périodes et variations viennent du back (voir `docs/technique/integration-api.md`).

## Règles d'affichage

- **Période en cours** : la dernière période de la plage (la semaine ou le mois en cours). Les chiffres clés, les variations et la répartition par type en proviennent. Les graphiques d'évolution (séances, durée) couvrent toutes les périodes de la plage.
- **Séances** : chaque activité compte pour une séance, dans la période qui contient sa date de début (UTC). Une période sans activité affiche zéro, elle n'est pas omise.
- **Durée** : affichée en heures (par exemple « 5,5 h ») ; les graphiques de durée utilisent les heures arrondies à deux décimales.
- **Libellés des axes** : semaine = `S` suivi du numéro ISO, sans année ; mois = mois abrégé et année, au format `fr-FR`.
- **Variation signée** : l'écart absolu et le pourcentage portent un signe `+` ou `−`. Une variation nulle n'a pas de signe et porte le libellé « Stable ».
  - Hausse : libellé « En hausse », icône ▲.
  - Baisse : libellé « En baisse », icône ▼.
  - Le sens est donné par le texte et le libellé, jamais par la couleur seule.
- **Variation « n/a »** : si la période précédente vaut zéro, le back renvoie un pourcentage absent (`null`). L'affichage est alors « +N (n/a) » (ou « −N (n/a) ») avec le libellé « Non comparable ». Le pourcentage n'est jamais affiché comme NaN.
- **Comparaison à une période complète** : la variation compare la période en cours, souvent incomplète, à la période précédente complète. Une baisse peut donc être mécanique. Une note affichée sous les chiffres clés le précise.

## États

| État                           | Déclencheur                                                         | Affichage                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chargement                     | Premier chargement, ou rechargement après changement de granularité | Titre et bascule visibles. Au premier chargement : texte « Chargement… » dans une zone `aria-busy="true"`. Annonce `aria-live` « Chargement des statistiques en cours ». Lors d'une bascule, la zone est `aria-busy="true"` et les dernières données restent affichées pendant le rechargement. |
| Vide                           | Toutes les périodes de la plage ont zéro séance                     | Message « Aucune activité sur cette période ». Ni chiffres clés, ni cartes. La bascule reste disponible. Le message porte sur toute la plage affichée (8 semaines ou 6 mois), pas seulement sur la période en cours.                                                                            |
| Période en cours sans activité | La période en cours est à zéro, les précédentes ne le sont pas      | Chiffres à zéro, variation et cartes affichées. Le graphique « Répartition par type » n'a pas de donnée et affiche « Aucune donnée à afficher ».                                                                                                                                                |
| Erreur                         | Échec de `GET /api/stats`                                           | Le contenu est remplacé par un bloc `role="alert"` affichant le message utilisateur de l'API, et un bouton « Réessayer ». Le bouton relance le chargement de la granularité courante. Titre et bascule restent visibles.                                                                        |

## Modale d'agrandissement

- Ouverture : bouton « Agrandir » de la carte. Son nom accessible est « Agrandir le graphique : <titre du graphique> ». Le titre de la modale est celui du graphique.
- Contenu : le graphique agrandi, la bascule Semaine / Mois, et le tableau des valeurs.
- Aucun appel au back à l'ouverture : la modale réutilise les données chargées par la page. Changer la granularité dans la modale recharge les données partagées avec la page.
- Fermeture : bouton « Fermer » ou touche Échap.
- Pendant l'ouverture, le reste de la page est masqué aux lecteurs d'écran (`aria-hidden`), puis restauré à la fermeture.
- Retour du focus sur la carte d'origine : attendu, mais non vérifié par un test à ce jour.

## Accessibilité

- Chaque graphique a un nom accessible (son titre) et un tableau des valeurs sous la carte : l'information ne repose pas sur la couleur.
- La légende n'apparaît que pour un graphique à plusieurs séries. Aujourd'hui, chaque graphique n'en a qu'une : les libellés et le tableau portent l'information.
- La bascule est un groupe de boutons radio « Granularité », libellés « Semaine » et « Mois ».

## Hors périmètre

Compte à rebours vers un événement, bilan hebdomadaire généré par l'IA, mini-calendrier de la semaine, commentaire IA, calendrier et planning : stories à venir.
