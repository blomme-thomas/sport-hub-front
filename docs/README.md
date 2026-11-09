# Documentation sport-hub-front

État : socle Angular, gestion des erreurs HTTP, tableau de bord (volume d'entraînement, issue #7), gestion des objectifs (issue #9) disponibilités (issue #8) et fiche de séance (issue #10) implémentés. Cette doc ne décrit que ce qui existe ; le reste est marqué « à compléter ».

## Technique

- [Architecture](technique/architecture.md)
- [Workflow Git](technique/workflow-git.md)
- [Intégration de l'API sport-hub-back](technique/integration-api.md)
- [Composants partagés](technique/composants-partages.md)
- [Développement](technique/developpement.md)
- [Décisions (ADR)](technique/decisions/) : [0001 erreurs HTTP normalisées en AppError](technique/decisions/0001-erreurs-http-normalisees-en-app-error.md), [0002 état du tableau de bord au niveau de la page](technique/decisions/0002-etat-du-tableau-de-bord-au-niveau-de-la-page.md)

## Fonctionnel

- [Fonctionnalités](fonctionnel/fonctionnalites.md)
- [Parcours](fonctionnel/parcours/) : [Consulter le tableau de bord](fonctionnel/parcours/consulter-tableau-de-bord.md), [Gérer les objectifs et événements](fonctionnel/parcours/gerer-objectifs-et-evenements.md), [Gérer les créneaux de disponibilité](fonctionnel/parcours/gerer-creneaux-disponibilite.md), [Consulter et modifier une séance](fonctionnel/parcours/consulter-et-modifier-une-seance.md), [Consulter le bilan hebdomadaire](fonctionnel/parcours/consulter-bilan-hebdomadaire.md), [Consulter les détails des dernières séances](fonctionnel/parcours/consulter-details-par-seance.md)
- [Glossaire](fonctionnel/glossaire.md)

Les règles de code font foi dans `instructions/`.
