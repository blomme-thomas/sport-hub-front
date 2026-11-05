# Workflow Git

Version autonome du workflow (aucun fichier de workflow propre à ce dépôt dans `instructions/`).

## Branches

- `main` : production. Reste la branche par défaut du repo GitHub (nécessaire à `Closes #n`, voir plus bas).
- `develop` : intégration, créée une fois depuis `main`.
- `feature/<n°-issue>-<slug>` : depuis `develop`, une fonctionnalité.
- `fix/<n°-issue>-<slug>` : depuis `develop`, un correctif.
- `release/x.y.z` : depuis `main`.
- `hotfix/*` : hors v1, non géré.

## Feature / fix

- La PR cible toujours `develop`, jamais `main`.
- Deux commits sur la branche : code + tests (`feat(...)` ou `fix(...)`), puis doc (`docs(...)`).
- Fusion de la PR en squash, message court en Conventional Commits avec le numéro d'issue/PR. Exemple : `feat(activities): affiche la liste des activités (#12)`.

## Release

1. `release/x.y.z` créée depuis `main`.
2. `develop` fusionnée dedans (merge commit, `--no-ff`).
3. Sur cette branche, uniquement : numéro de version, CHANGELOG, statuts de la doc fonctionnelle. Vérifications et recette locale.
4. Défaut en recette : correctif sur `fix/...` depuis `develop` (PR squashée vers `develop`), puis `develop` re-fusionnée dans la release (merge commit). Jamais de correctif de code directement sur la release.
5. PR `release/x.y.z` vers `main`.
6. Mise en production : merge de la release dans `main` (merge commit, jamais `develop` directement), tag `vx.y.z`, release GitHub.

Pas de merge-back : `main` n'est jamais refusionnée dans `develop`.

## Types de merge

| PR                                   | Merge                    |
| ------------------------------------ | ------------------------ |
| `feature/*` / `fix/*` vers `develop` | Squash                   |
| `develop` vers `release/x.y.z`       | Merge commit (`--no-ff`) |
| `release/x.y.z` vers `main`          | Merge commit (`--no-ff`) |

## Confirmations obligatoires

Confirmation explicite de l'utilisateur avant : tout push, toute création de PR, tout tag, tout merge sur `main`, toute release GitHub.

## Interdits

- Commit direct sur `main`, `develop` ou `release/*` hors étapes ci-dessus.
- Force-push.
- PR de `feature/*` directement vers `main`.
- Correctif de code sur une branche de release.

## Schéma

```
main        ●──────────────────────────────●──────────────
                                          ↗ (3) PR + tag (MEP)
                        release/x.y.z ●──┘
                        (1) créée depuis main, develop y est fusionnée
                        (2) version + CHANGELOG seulement
                             ↑
develop     ●────●────●─────┴──●───────────────────────────
             \  ↗      \  ↗
feature/*     ●●        ●●        (PR squashée vers develop)
fix/*         (stabilisation : depuis develop, puis re-fusion dans la release)
```

## Piège GitHub : `Closes #n`

`Closes #n` / `Fixes #n` ne ferment une issue que si la PR est fusionnée dans la branche par défaut. Tant que `main` est la branche par défaut, une PR squashée dans `develop` ne ferme pas l'issue. Le cycle de vie des issues et items de Project est donc géré explicitement : statut intermédiaire après fusion dans `develop`, statut final et fermeture effective seulement à la mise en production (merge de la release dans `main`).
