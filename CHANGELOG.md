# Changelog

Toutes les évolutions notables de `sport-hub-front` sont listées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; versions au sens [SemVer](https://semver.org/lang/fr/).

## [0.1.0]

Première version du dashboard sport-hub.

### Socle

- Socle Angular (zoneless, standalone, signals), ng-zorro-antd, thème clair et sombre à partir de tokens de design.
- Navigation par sidebar, interprétation uniforme des erreurs Problem Details.
- Composant graphique Chart.js partagé, husky et lint-staged pour formater avant chaque commit.

### Tableau de bord

- Cinq indicateurs clés avec mini-courbes, sélecteur de période 7 jours, 30 jours, 3 mois, 1 an.
- Volume d'entraînement, répartition par sport en donut (par famille de sport), zones d'entraînement.
- Carte Performances, courbes de FC colorées par zone, détails par séance avec FC et détail d'activité au clic.
- Compte à rebours jusqu'au prochain événement, dernières séances, mini-calendrier de la semaine.
- Calendrier d'entraînement mensuel, modale de détail d'activité avec commentaire.
- États de chargement, vide et erreur par carte, responsive et accessibilité, mouvement réduit.

### Calendrier et séances

- Calendrier semaine des créneaux libres et occupés, création au clic ou par glisser, quart d'heure par quart d'heure.
- Déplacement de créneaux et de séances par glisser-déposer, déplacement ou annulation d'une seule occurrence.
- Séances planifiées : fiche détaillée, édition des modules, durée modifiable depuis la vignette, séances réalisées protégées.
- Coche sur les séances réalisées, pauses affichées en bandeau.
- Génération du planning de la semaine, du mois ou jusqu'à un événement.
- Import de séances depuis un fichier JSON (glisser-déposer), création et modification pré-remplies depuis le JSON, export d'une séance avec son activité réalisée.
- Discipline d'une séance choisie par famille de sport (course, vélo, natation).

### Objectifs et réglages

- Écran de gestion des objectifs et événements.
- Cible hebdomadaire dans les paramètres personnels.

### Limites connues

- Les fonctionnalités d'intelligence artificielle du front (conseil du tableau de bord, bilan hebdomadaire) sont désactivées dans cette version, sans aucune requête vers l'API.
