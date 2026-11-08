# Consulter le tableau de bord

> Statut : implémenté (issues #7 et #13). Tests unitaires livrés (mapper, états, composants, page) pour le volume d'entraînement et pour le bloc « Prochain événement ». Le test e2e du parcours n'est pas encore écrit.

## But

Voir d'un coup d'œil, sur la page d'accueil, le prochain événement à venir et le temps qui reste avant lui, puis le volume d'entraînement (nombre de séances et durée) de la période en cours, sa variation par rapport à la période précédente, et son évolution sur la plage affichée.

## Point d'entrée

- Route `/`, chargée en lazy (`features/dashboard/dashboard.routes.ts`). Titre de page : « Tableau de bord ».
- Utilisateur unique, sans authentification.

## Étapes

1. Ouvrir `/`. La page affiche le titre, la bascule Semaine / Mois (Semaine par défaut), puis le bloc « Prochain événement », et le chargement des statistiques.
2. Lire le bloc « Prochain événement », en tête de page : nombre de jours restants jusqu'au prochain événement à venir, titre, format et temps cible. Sans événement à venir, le bloc invite à en créer un (voir « Prochain événement » ci-dessous).
3. Lire les chiffres clés de la période en cours : nombre de séances et durée (en heures), chacun avec sa variation.
4. Lire la note sur la comparaison, puis les trois cartes : séances par période, durée par période, répartition par type (dernière période).
5. Basculer Semaine / Mois : les statistiques sont rechargées, les chiffres et les graphiques sont mis à jour, et une annonce `aria-live` indique la granularité affichée. Le bloc « Prochain événement » n'est pas rechargé.
6. Agrandir une carte avec son bouton « Agrandir » : une modale affiche le graphique en grand, avec son titre, la bascule de granularité et le tableau des valeurs.
7. Fermer la modale avec le bouton « Fermer » ou la touche Échap.

## Prochain événement

Bloc en tête de page, sous le titre et la bascule, avant les chiffres clés. Il est indépendant du volume d'entraînement : une erreur sur l'un n'empêche pas l'affichage de l'autre.

- **Événement retenu** : parmi les objectifs de type « Événement » dont la date est aujourd'hui ou plus tard (jour UTC), le plus proche. Les objectifs « Volume » ou « Régularité », et ceux sans date, sont ignorés. À date égale, l'ordre renvoyé par l'API est conservé. Voir `docs/technique/integration-api.md`.
- **Compte à rebours** : le nombre de jours entiers entre aujourd'hui et la date de l'événement. Libellés : « Aujourd'hui » (0), « 1 jour restant » (1), « n jours restants » (n).
- **Titre, format, temps cible** : le titre de l'objectif, puis le format (« Sprint », « Olympique », « Half (semi-distance) », « Full (distance complète) », « Autre ») et le temps cible au format « H h M min S s ». Si le format ou le temps cible n'est pas renseigné, le bloc affiche « Format non défini » ou « Temps cible non défini ».
- **Jour de référence** : le jour UTC, figé à l'ouverture de la page. Une page laissée ouverte au-delà de minuit ne recalcule pas le compte à rebours tant qu'elle n'est pas rechargée.
- **Décalage horaire** : le jour est lu en UTC, comme le reste du tableau de bord. À Paris, entre minuit et 1 h (heure d'hiver) ou entre minuit et 2 h (heure d'été), le jour UTC est encore la veille. Pendant ces heures, le compte à rebours affiche donc un jour de plus que le calendrier local, et un événement de la veille locale peut afficher « Aujourd'hui ». Le formulaire d'objectifs enregistre la date en calendrier local (voir `docs/fonctionnel/parcours/gerer-objectifs-et-evenements.md`, « Limites connues »).

### États du bloc

| État            | Déclencheur                                   | Affichage                                                                                                                                                                      |
| --------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chargement      | Premier chargement de `GET /api/goals`        | Texte « Chargement… » dans une zone `aria-busy="true"`.                                                                                                                        |
| Événement       | Au moins un événement à venir                 | Grand chiffre « N jours restants » (ou « Aujourd'hui »), titre en titre de niveau 3, puis format et temps cible.                                                               |
| Aucun événement | Aucun événement à venir (liste vide comprise) | Texte « Aucun événement à venir. » suivi d'un lien « Créer un événement » vers `/goals`. Pas d'erreur, pas de `role="alert"`.                                                  |
| Erreur          | Échec de `GET /api/goals`                     | Bloc `role="alert"` affichant le message utilisateur de l'API, et un bouton « Réessayer » qui relance uniquement le chargement de ce bloc. Les statistiques restent affichées. |

Le bloc n'est pas relancé par la bascule Semaine / Mois. La section porte le titre « Prochain événement » (`h2`), relié à la section par `aria-labelledby`.

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

Progression chiffrée vers l'objectif, bilan hebdomadaire généré par l'IA, mini-calendrier de la semaine, commentaire IA, calendrier et planning : stories à venir.
