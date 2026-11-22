---
description: 'Formulaires : Reactive Forms typés, validation, composants de formulaire ng-zorro, ControlValueAccessor.'
applyTo: '**/*form*.ts,**/*.component.html'
---

# Formulaires

Squelette : `templates/form.component.template.ts` (`11`).

## Règles

- **Reactive Forms typés** (`FormBuilder.nonNullable.group`, `FormControl<string>`). Pas de template-driven forms, pas d'`any` dans les contrôles.
- Le `FormGroup` vit dans le composant (ou une classe `*.form.ts` pour les gros formulaires), pas dans le template.
- Validation : validators natifs + validators fonctionnels maison dans `shared/validators/`. Afficher l'erreur seulement si `touched || dirty`.
- Soumission : désactiver le bouton pendant l'envoi (signal `submitting`), gérer l'erreur serveur, émettre une valeur typée via `output()` ou appeler le store.
- Valeur envoyée à l'API = modèle UI mappé vers le DTO API (`04`), jamais `form.value` brut.
- Composants ng-zorro de saisie (`nz-input-number`, `nz-date-picker`, `nz-select`…) utilisés avec `formControlName`.
- Champ réutilisable avec logique propre → `ControlValueAccessor` dans `shared/`.
- Accessibilité : `<label for>` ou `aria-label`, messages d'erreur reliés via `aria-describedby` (`08`).
