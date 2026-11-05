---
description: 'Composants Angular : standalone, OnPush, input()/output()/model(), control flow, templates, anti-patterns.'
applyTo: '**/*.component.ts,**/*.page.ts,**/*.component.html,**/*.page.html,**/*.component.scss,**/*.page.scss'
---

# Composants

Squelettes : `templates/page.component.template.ts`, `templates/presentational-component.template.ts` (`11`).

## Règles obligatoires

- **Standalone** par défaut (ne pas écrire `standalone: true` si la version d'Angular l'implique) ; imports explicites dans `imports: []`.
- `changeDetection: ChangeDetectionStrategy.OnPush` sur **tous** les composants.
- Sélecteur préfixé `sh-` en kebab-case (`sh-activity-card`).
- Dépendances via `inject()` (champ `private readonly`), pas d'injection par constructeur.
- Entrées/sorties via fonctions : `input()`, `input.required<T>()`, `output<T>()`, `model<T>()`. Pas de `@Input`/`@Output`/`@HostBinding`/`@HostListener` : utiliser `host: {}` dans le décorateur.
- État local en **signals** ; valeurs dérivées en `computed()`. Pas de méthode appelée dans le template pour calculer une valeur (utiliser `computed`/pipe).
- Control flow natif : `@if`, `@for (x of xs; track x.id)`, `@switch`, `@defer`. Jamais `*ngIf/*ngFor`. `track` obligatoire et sur un identifiant stable.
- `[class.x]` / `[style.x]` plutôt que `ngClass`/`ngStyle`.
- Images statiques : `NgOptimizedImage`.

## Smart vs presentational

- **Page** (smart) : routée, injecte stores/services, aucune mise en forme détaillée.
- **Présentation** : aucune injection de service de données ; uniquement `input()`/`output()` ; testable avec de simples inputs.
- Si un composant dépasse ~150 lignes de template ou mélange chargement + mise en forme, le scinder.

## Templates

- Pas de logique complexe (pas d'expressions chaînées, pas de `new`, pas d'appels de fonction coûteux).
- Pas de `any` ni de `$any()`; les types du template doivent compiler en mode strict (`strictTemplates`).
- Textes affichés via variables/constantes, pas de valeurs métier codées en dur dans le HTML.
- Accessibilité : voir `08`.

## Cycle de vie et effets

- Préférer `computed`/`linkedSignal`/`resource` à `effect()`. Un `effect` ne sert qu'aux effets de bord (log, DOM impératif, intégration lib tierce), jamais à propager de l'état.
- Pas de `ngOnInit` pour charger des données : utiliser une `resource` ou un store (`03`, `04`).
- Nettoyage : `DestroyRef.onDestroy` ou `takeUntilDestroyed()` (`07`).
