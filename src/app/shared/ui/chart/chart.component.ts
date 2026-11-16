import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { Chart, type ChartData, type ChartOptions, type ChartType } from 'chart.js';
import './chart-registry';

const EMPTY_MESSAGE = 'Aucune donnée à afficher';

const DEFAULT_OPTIONS: ChartOptions = { responsive: true, maintainAspectRatio: false };

function isEmpty(data: ChartData): boolean {
  return data.datasets.every((dataset) =>
    dataset.data.every((value) => value === null || value === undefined),
  );
}

/** Vrai quand l'utilisateur demande moins de mouvement ; absent des environnements sans `matchMedia`. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true
  );
}

function withDefaults(options: ChartOptions): ChartOptions {
  // Chart.js anime ses graphiques par défaut, en JS (hors CSS) : on le coupe pour qui demande moins de mouvement.
  const motion: ChartOptions = prefersReducedMotion() ? { animation: false } : {};
  return { ...DEFAULT_OPTIONS, ...motion, ...options };
}

function cloneData(data: ChartData): ChartData {
  return {
    ...data,
    ...(data.labels && { labels: [...data.labels] }),
    datasets: data.datasets.map((dataset) => ({ ...dataset, data: [...dataset.data] })),
  };
}

/**
 * Affiche un graphique Chart.js à partir de données déjà mappées.
 *
 * L'instance Chart.js est créée une fois, mise à jour quand les entrées changent, recréée si `type` change
 * et détruite avec le composant. Chart.js mute les tableaux qu'il reçoit : les données sont donc copiées
 * (les fonctions des options scriptables sont conservées). Sans donnée (aucun jeu de données ou toutes les
 * valeurs nulles), le canvas est masqué et le message d'état vide est annoncé à la place.
 */
@Component({
  selector: 'sh-chart',
  template: `
    <div class="sh-chart">
      <canvas
        #canvas
        class="sh-chart__canvas"
        role="img"
        [attr.aria-label]="label()"
        [hidden]="empty()"
      ></canvas>
      <p class="sh-chart__empty" role="status">{{ empty() ? emptyMessage : '' }}</p>
    </div>
  `,
  styleUrl: './chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent {
  readonly type = input.required<ChartType>();
  readonly data = input.required<ChartData>();
  readonly options = input<ChartOptions>({});
  readonly label = input.required<string>();

  protected readonly emptyMessage = EMPTY_MESSAGE;
  protected readonly empty = computed(() => isEmpty(this.data()));

  // Non requis et lu dans l'effet : si le canvas n'est pas encore rendu, l'effet se relance quand il l'est.
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private rendered: { chart: Chart; type: ChartType } | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destroyChart());

    effect(() => {
      const canvas = this.canvas();
      const type = this.type();
      const data = this.data();
      const options = this.options();
      const empty = this.empty();
      if (canvas === undefined) {
        return;
      }
      untracked(() => this.sync(canvas.nativeElement, type, data, options, empty));
    });
  }

  private sync(
    canvas: HTMLCanvasElement,
    type: ChartType,
    data: ChartData,
    options: ChartOptions,
    empty: boolean,
  ): void {
    if (empty) {
      this.destroyChart();
      return;
    }

    if (this.rendered && this.rendered.type !== type) {
      this.destroyChart();
    }

    if (!this.rendered) {
      this.rendered = {
        type,
        chart: new Chart(canvas, {
          type,
          data: cloneData(data),
          options: withDefaults(options),
        }),
      };
      return;
    }

    const { chart } = this.rendered;
    chart.data = cloneData(data);
    chart.options = withDefaults(options);
    chart.update();
  }

  private destroyChart(): void {
    this.rendered?.chart.destroy();
    this.rendered = null;
  }
}
