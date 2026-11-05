---
description: 'Architecture du front : core / shared / features, sens des dépendances, lazy loading, séparation page vs présentation.'
applyTo: '**'
---

# Architecture et structure

## Principes

- Organisation **par feature**, pas par type technique (pas de dossiers globaux `components/`, `services/`).
- Pas d'architecture DDD/hexagonale ici : la logique métier (calculs de charge, génération de séances) vit dans le **back**. Le front affiche, saisit, orchestre l'UI.
- Toute application = composants **standalone** ; pas de `NgModule` (`11`).

## Couches et dépendances

```
features/<f>  →  shared  →  (rien)
features/<f>  →  core
core          →  shared
```

- Une feature **n'importe jamais** une autre feature. Besoin partagé ? Le remonter dans `shared/` (UI) ou `core/` (singleton).
- `shared/` ne dépend ni de `core/` ni d'une feature.
- Les imports se font par chemins relatifs dans une feature ; alias `@core/*`, `@shared/*`, `@features/*` pour traverser les frontières (déclarés dans `tsconfig`).

## Dans une feature

```
features/<feature>/
  pages/          # composants routés (smart)
  components/     # composants de présentation propres à la feature
  data-access/    # services API, stores, mappers
  models/         # modèles UI + types API (*.api.ts)
  <feature>.routes.ts
```

- Une page = peu de logique : elle lit l'état (store/resource), passe des données aux composants enfants, réagit à leurs `output()`.
- La logique de transformation (formatage, agrégation d'affichage) va dans un `computed`, un pipe ou un mapper — pas dans le template.

## Règles

- Chaque feature est chargée par `loadChildren`/`loadComponent` (`05`).
- Pas de service d'état global « fourre-tout » : un état appartient à la feature qui l'utilise, remonté dans `core` seulement s'il est réellement transverse.
- Pas de dépendance circulaire (vérifier à la revue, `10`).
- Détails de nommage, arborescence exacte et alias : `11`.
