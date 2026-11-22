---
description: 'UI : ng-zorro-antd (Ant Design, thème, imports), graphiques Chart.js, SCSS, responsive, accessibilité.'
applyTo: '**/*.scss,**/*.html,**/*.component.ts,**/charts/**'
---

# UI, styles, graphiques et accessibilité

Squelette : `templates/chart.component.template.ts` (`11`).

## ng-zorro-antd (Ant Design)

- Seule bibliothèque de composants UI (MIT, sans clé de licence). Ne pas mélanger avec une autre lib (Material, PrimeNG, etc.).
- Composants **standalone importés à l'unité** depuis leur entrée secondaire (`import { NzButtonModule } from 'ng-zorro-antd/button'`) dans `imports: []` du composant qui les utilise.
- Feuille de style globale `ng-zorro-antd.min.css` déclarée dans `angular.json` ; langue via `provideNzI18n(fr_FR)` dans `app.config.ts`. Personnalisation par les variables CSS du thème, pas en surchargeant les classes `.ant-*` en CSS (pas de `::ng-deep`).
- Icônes : `provideNzIcons([...])` avec uniquement les icônes utilisées.
- Feedback utilisateur : `NzMessageService` (messages éphémères) / `NzNotificationService` pour les erreurs globales (`04`).
- Pas de composant ng-zorro utilisé directement dans une page si une enveloppe `shared/` existe pour le même usage.

## Chart.js

- Utiliser `Chart.js` directement, via **un seul** composant wrapper `shared/ui/chart` (canvas + instance Chart.js, détruite via `DestroyRef`), à créer à la première utilisation ; pas de bibliothèque de wrapper supplémentaire sans accord.
- Chaque graphique = **un composant de présentation** dans `charts/` ou `components/` : `input()` des données typées, options calculées dans un `computed`, aucune requête HTTP.
- Enregistrer uniquement les éléments Chart.js utilisés (tree-shaking), pas `registerables` complet.
- Couleurs lues depuis les tokens CSS/thème, pas de hex en dur dans le TS.
- Un graphique doit avoir un équivalent texte accessible (`aria-label`, résumé ou tableau caché) et gérer les états vide/chargement.
- Les données arrivent déjà mappées (`04`) ; la mise en forme Chart.js (datasets, labels) se fait dans un `computed` du composant.

## SCSS

- Styles encapsulés par composant (`ViewEncapsulation.Emulated` par défaut). Pas de `::ng-deep`.
- Variables en **CSS custom properties** (`--sh-*`) définies globalement ; pas de valeurs magiques répétées.
- Mise en page : CSS Grid/Flexbox. Approche mobile-first, un dashboard doit rester lisible sur tablette.

## Accessibilité (minimum obligatoire)

- Éléments sémantiques (`button`, `nav`, `main`, `h1..h6`) ; pas de `div` cliquable.
- Tout contrôle a un nom accessible (label, `aria-label`).
- Navigation clavier complète, focus visible, contraste suffisant (AA).
- Ne jamais transmettre une information uniquement par la couleur (graphiques, statuts).
- Annoncer les mises à jour dynamiques importantes (`aria-live="polite"`).
