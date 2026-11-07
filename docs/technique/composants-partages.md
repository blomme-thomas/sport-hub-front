# Composants partagés

Emplacement cible : `src/app/shared/` (`ui/`, `pipes/`, `directives/`, `validators/`, `utils/`), sans dépendance vers une feature. Préfixe de sélecteur : `sh-`. UI basée sur ng-zorro-antd (Ant Design), graphiques sur Chart.js via un wrapper unique `shared/ui/chart`.

## Catalogue

### `sh-chart` (`shared/ui/chart`)

Wrapper Chart.js réutilisable, sans données ni appel API : il affiche le graphique à partir de données déjà mappées par la feature appelante. Fichiers : `chart.component.ts`, `chart.component.scss`, `chart-registry.ts`, `chart.component.spec.ts`.

Import (pas de barrel `index.ts` pour ce dossier) :

```ts
import { ChartComponent } from '@shared/ui/chart/chart.component';
```

**Inputs**

| Input     | Type                 | Obligatoire | Rôle                                                                  |
| --------- | -------------------- | ----------- | --------------------------------------------------------------------- |
| `type`    | `ChartType`          | oui         | Type de graphique Chart.js (`bar`, `line`, ...)                       |
| `data`    | `ChartData`          | oui         | Labels et jeux de données                                             |
| `options` | `ChartOptions`       | non (`{}`)  | Options Chart.js, fusionnées après les valeurs par défaut             |
| `label`   | `string`             | oui         | Nom accessible du graphique (`aria-label` du canvas)                  |

Les types sont les types larges de Chart.js : le wrapper n'est pas générique. Le typage précis se fait côté consommateur.

**Options par défaut**

`{ responsive: true, maintainAspectRatio: false }`, puis `options` les surcharge. La taille vient du conteneur : `width: 100%` et `height: var(--sh-chart-height, 20rem)`. Pour changer la hauteur, définir `--sh-chart-height` sur le composant ou un ancêtre.

**État vide**

Vide = aucun jeu de données, ou tous les jeux ne contiennent que des `null` / `undefined`. Dans ce cas, aucune instance Chart.js n'existe, le canvas est masqué (`hidden`) et le paragraphe `role="status"` affiche « Aucune donnée à afficher ». Hors de l'état vide, ce paragraphe reste présent mais sans texte.

**Accessibilité**

- Le canvas porte `role="img"` et `aria-label` = `label`.
- Le message d'état vide est dans un élément `role="status"`, donc annoncé par les lecteurs d'écran.
- Il n'y a pas de tableau de substitution ni de texte alternatif généré : seul `label` décrit le graphique.

**Cycle de vie**

- L'instance Chart.js est créée au premier rendu avec des données non vides.
- Un changement de `data` ou de `options` met à jour l'instance existante (`chart.data`, `chart.options`, `chart.update()`), sans la recréer.
- Un changement de `type` détruit l'instance puis en crée une nouvelle.
- Passage à l'état vide : l'instance est détruite. Retour à des données non vides : une nouvelle instance est créée.
- À la destruction du composant, l'instance est détruite via `DestroyRef`.
- Les données sont copiées avant d'être passées à Chart.js (ses tableaux sont mutés en interne) ; les fonctions des options (scriptables) sont conservées.

**Enregistrement Chart.js**

`chart-registry.ts` appelle `Chart.register(...)` une fois, avec une liste explicite : `BarController`, `LineController`, `BarElement`, `LineElement`, `PointElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend`. Il n'utilise pas `registerables`. Le composant l'importe, le consommateur n'a rien à importer. **Pour tout nouveau type de graphique ou plugin, ajouter ses contrôleurs et éléments Chart.js à cette liste.** Sans cela, Chart.js ne sait pas dessiner le type.

**Exemple d'usage**

```ts
@Component({
  selector: 'sh-exemple',
  imports: [ChartComponent],
  template: `
    <sh-chart type="bar" [data]="data()" [options]="options" label="Volume hebdomadaire" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExempleComponent {
  readonly data = signal<ChartData>({
    labels: ['Lun', 'Mar', 'Mer'],
    datasets: [{ label: 'km', data: [5, 10, 7] }],
  });
  readonly options: ChartOptions = { plugins: { legend: { display: false } } };
}
```

Le consommateur passe des données déjà mappées, dans un signal ou une valeur stable, et met à jour le signal pour rafraîchir le graphique.
