---
description: 'Méthode de travail : étapes, clarification, dépendances, refactorings, résumé, checklist de revue.'
applyTo: '**'
---

# Méthode de travail et revue

## Démarche

1. **Lire** les instructions applicables (`CLAUDE.md` → table), le code voisin, les tests et `11`.
2. **Identifier** la feature et la couche concernées (page, présentation, data-access, core/shared).
3. **Repérer** le contrat API concerné dans `sport-hub-back` (ne pas inventer de champ).
4. **Clarifier** : poser la question si un comportement UI/produit manque ; sinon énoncer l'hypothèse (« Hypothèse : … ») dans le résumé.
5. **Changer** de façon ciblée, avec les templates (`11`) comme point de départ.
6. **Tester** : unitaires/composants (`09`), E2E si le parcours change (`09b`).
7. **Contrôler** : lancer lint, tests, build (commandes en `11`) ; signaler ce qui n'a pas pu l'être.
8. **Résumer** : changements, décisions, hypothèses, résultats, risques.

## Règles spécifiques

- **Contrat API** : un changement de forme côté back impose de mettre à jour `*.api.ts`, le mapper et les handlers MSW ensemble.
- **Nouvelles dépendances** : justifier (besoin, alternative déjà présente, maintenance, taille du bundle) ; préférer ng-zorro-antd/Chart.js/RxJS déjà en place.
- **Refactorings** : sans changement de comportement, séparés des évolutions fonctionnelles, protégés par des tests.
- **Sécurité** : pas de secret ni d'URL privée dans le code ; pas de `innerHTML`/`bypassSecurityTrust*` sans justification.
- **Performance** : lazy loading, `track` dans les `@for`, pas de calcul coûteux dans les templates, `@defer` pour les graphiques lourds.

## Contradictions

Si le code existant s'écarte de ces règles (ex. `NgModule`, `*ngIf`), **suivre l'existant pour le code modifié**, le signaler dans le résumé et proposer une migration séparée.

## Checklist de revue

- Structure et dépendances conformes à `01` (pas de feature → feature) ?
- Composants : standalone, OnPush, signals, control flow, pas de logique dans le template (`02`) ?
- Pas de `HttpClient` hors data-access, DTO API mappé (`04`) ?
- Pas de `subscribe` manuel ni d'`effect` d'état (`03`, `07`) ?
- États loading / vide / erreur gérés ? Accessibilité de base (`08`) ?
- Tests pertinents, non affaiblis (`09`, `09b`) ?
- Périmètre limité, hypothèses signalées ?
