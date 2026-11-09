import type { ComponentFixture } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import type { ChartData, ChartOptions, ChartType } from 'chart.js';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChartComponent } from './chart.component';

const chartJs = vi.hoisted(() => {
  interface FakeConfig {
    type: string;
    data: { datasets: unknown[] };
    options: unknown;
  }

  const instances: FakeChart[] = [];
  const registrations: unknown[][] = [];

  class FakeChart {
    static readonly register = vi.fn((...items: unknown[]) => {
      registrations.push(items);
    });

    readonly config: FakeConfig;
    readonly update = vi.fn();
    readonly destroy = vi.fn();

    constructor(
      readonly canvas: HTMLCanvasElement,
      config: FakeConfig,
    ) {
      this.config = config;
      instances.push(this);
    }

    get data(): FakeConfig['data'] {
      return this.config.data;
    }

    set data(data: FakeConfig['data']) {
      this.config.data = data;
    }

    get options(): unknown {
      return this.config.options;
    }

    set options(options: unknown) {
      this.config.options = options;
    }
  }

  return { instances, registrations, FakeChart };
});

vi.mock('chart.js', () => ({
  Chart: chartJs.FakeChart,
  ArcElement: 'ArcElement',
  DoughnutController: 'DoughnutController',
  BarController: 'BarController',
  LineController: 'LineController',
  BarElement: 'BarElement',
  LineElement: 'LineElement',
  PointElement: 'PointElement',
  CategoryScale: 'CategoryScale',
  LinearScale: 'LinearScale',
  Tooltip: 'Tooltip',
  Legend: 'Legend',
}));

const LABEL = 'Charge hebdomadaire';

const chartData: ChartData = {
  labels: ['Lun', 'Mar'],
  datasets: [{ label: 'Charge', data: [40, 55] }],
};

const otherChartData: ChartData = {
  labels: ['Lun', 'Mar', 'Mer'],
  datasets: [{ label: 'Charge', data: [40, 55, 30] }],
};

const emptyChartData: ChartData = { datasets: [] };

const nullChartData: ChartData = {
  datasets: [{ label: 'Charge', data: [null, null] }],
};

interface Overrides {
  type?: ChartType;
  data?: ChartData;
  options?: ChartOptions;
}

function inputs(overrides: Overrides = {}) {
  return {
    type: 'bar' as ChartType,
    data: chartData,
    label: LABEL,
    ...overrides,
  };
}

function setInputs(fixture: ComponentFixture<ChartComponent>, overrides: Overrides): void {
  for (const [name, value] of Object.entries(inputs(overrides))) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
}

describe('ChartComponent', () => {
  beforeEach(() => {
    chartJs.instances.length = 0;
  });

  it('crée une instance Chart.js sur le canvas avec le type et les données', async () => {
    await render(ChartComponent, { inputs: inputs() });

    expect(chartJs.instances).toHaveLength(1);
    const [chart] = chartJs.instances;
    expect(chart.canvas).toBe(screen.getByRole('img'));
    expect(chart.config.type).toBe('bar');
    expect(chart.config.data).toEqual(chartData);
  });

  it('applique les options responsive par défaut', async () => {
    await render(ChartComponent, { inputs: inputs() });

    expect(chartJs.instances[0].config.options).toEqual({
      responsive: true,
      maintainAspectRatio: false,
    });
  });

  it('laisse les options du consommateur surcharger les valeurs par défaut', async () => {
    await render(ChartComponent, {
      inputs: inputs({
        options: { maintainAspectRatio: true, plugins: { legend: { display: false } } },
      }),
    });

    expect(chartJs.instances[0].config.options).toEqual({
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
    });
  });

  it('ne crée qu une seule instance au rendu initial', async () => {
    const { detectChanges } = await render(ChartComponent, { inputs: inputs() });

    detectChanges();

    expect(chartJs.instances).toHaveLength(1);
  });

  it('met à jour le graphique existant quand les données changent', async () => {
    const { fixture } = await render(ChartComponent, { inputs: inputs() });
    const [chart] = chartJs.instances;

    setInputs(fixture, { data: otherChartData });

    expect(chartJs.instances).toHaveLength(1);
    expect(chart.update).toHaveBeenCalledTimes(1);
    expect(chart.config.data).toEqual(otherChartData);
  });

  it('met à jour les options fusionnées sans recréer le graphique', async () => {
    const { fixture } = await render(ChartComponent, { inputs: inputs() });
    const [chart] = chartJs.instances;

    setInputs(fixture, { options: { plugins: { legend: { display: false } } } });

    expect(chartJs.instances).toHaveLength(1);
    expect(chart.update).toHaveBeenCalledTimes(1);
    expect(chart.config.options).toEqual({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    });
  });

  it('transmet à Chart.js une copie des données, indépendante du tableau d origine', async () => {
    const values = [40, 55];
    const source: ChartData = {
      labels: ['Lun', 'Mar'],
      datasets: [{ label: 'Charge', data: values }],
    };

    await render(ChartComponent, { inputs: inputs({ data: source }) });
    values.push(99);

    expect(chartJs.instances[0].config.data.datasets[0]).toEqual({
      label: 'Charge',
      data: [40, 55],
    });
  });

  it('accepte des données contenant une option scriptable et la transmet à Chart.js', async () => {
    const scripted: ChartData = {
      labels: ['Lun'],
      datasets: [{ label: 'Charge', data: [40], backgroundColor: () => 'transparent' }],
    };

    await render(ChartComponent, { inputs: inputs({ data: scripted }) });

    expect(chartJs.instances).toHaveLength(1);
    expect(chartJs.instances[0].config.data.datasets[0]).toMatchObject({
      backgroundColor: expect.any(Function),
    });
  });

  it('détruit puis recrée le graphique quand le type change', async () => {
    const { fixture } = await render(ChartComponent, { inputs: inputs() });
    const [previous] = chartJs.instances;

    setInputs(fixture, { type: 'line' });

    expect(previous.destroy).toHaveBeenCalledTimes(1);
    expect(chartJs.instances).toHaveLength(2);
    expect(chartJs.instances[1].config.type).toBe('line');
  });

  it('détruit l instance Chart.js quand le composant est détruit', async () => {
    const { fixture } = await render(ChartComponent, { inputs: inputs() });
    const [chart] = chartJs.instances;

    fixture.destroy();

    expect(chart.destroy).toHaveBeenCalledTimes(1);
  });

  it('donne au canvas le nom accessible passé en entrée', async () => {
    await render(ChartComponent, { inputs: inputs() });

    expect(screen.getByRole('img', { name: LABEL })).toBeInTheDocument();
  });

  it('affiche le message d état vide à la place du graphique sans jeu de données', async () => {
    await render(ChartComponent, { inputs: inputs({ data: emptyChartData }) });

    expect(await screen.findByRole('status')).toHaveTextContent('Aucune donnée à afficher');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('considère vide un jeu de données dont toutes les valeurs sont nulles', async () => {
    await render(ChartComponent, { inputs: inputs({ data: nullChartData }) });

    expect(await screen.findByRole('status')).toHaveTextContent('Aucune donnée à afficher');
    expect(chartJs.instances).toHaveLength(0);
  });

  it('ne crée aucune instance Chart.js sans donnée', async () => {
    await render(ChartComponent, { inputs: inputs({ data: emptyChartData }) });

    expect(chartJs.instances).toHaveLength(0);
  });

  it('crée le graphique quand des données arrivent après un état vide', async () => {
    const { fixture } = await render(ChartComponent, { inputs: inputs({ data: emptyChartData }) });

    setInputs(fixture, { data: chartData });

    expect(chartJs.instances).toHaveLength(1);
    expect(screen.getByRole('img', { name: LABEL })).toBeInTheDocument();
    expect(screen.queryByText('Aucune donnée à afficher')).not.toBeInTheDocument();
  });

  it('détruit le graphique quand les données deviennent vides', async () => {
    const { fixture } = await render(ChartComponent, { inputs: inputs() });
    const [chart] = chartJs.instances;

    setInputs(fixture, { data: emptyChartData });

    expect(chart.destroy).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('status')).toHaveTextContent('Aucune donnée à afficher');
  });
});

describe('chart-registry', () => {
  it('enregistre uniquement les contrôleurs, éléments, échelles et plugins utilisés', () => {
    expect(chartJs.registrations).toEqual([
      [
        ArcElement,
        BarController,
        DoughnutController,
        LineController,
        BarElement,
        LineElement,
        PointElement,
        CategoryScale,
        LinearScale,
        Tooltip,
        Legend,
      ],
    ]);
  });
});
