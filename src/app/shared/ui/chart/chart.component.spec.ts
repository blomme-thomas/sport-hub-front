import { TestBed, type ComponentFixture } from '@angular/core/testing';
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
import { CHART_REGISTERED_ITEMS } from './chart-registry';
import { chartJsInstances } from '../../../../mocks/chart-js.fake';
import { ChartComponent } from './chart.component';

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

/**
 * Rendu du composant en attendant la stabilisation. L'effet qui crée l'instance Chart.js lit le canvas, résolu
 * pendant la première détection de changements : il ne s'applique qu'à la passe suivante. Deux passes
 * explicites rendent la lecture de `chartJsInstances` déterministe, sur un runner chargé comme en local.
 */
async function renderChart(options: { inputs?: Record<string, unknown> }) {
  const result = await render(ChartComponent, options);
  result.fixture.detectChanges();
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  await result.fixture.whenStable();
  TestBed.tick();
  return result;
}

describe('ChartComponent', () => {
  it('désactive l’animation de Chart.js quand l’utilisateur demande moins de mouvement', async () => {
    const original = window.matchMedia;
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    try {
      await renderChart({ inputs: inputs() });
      expect(chartJsInstances[0]?.config.options).toMatchObject({ animation: false });
    } finally {
      window.matchMedia = original;
    }
  });

  beforeEach(() => {
    chartJsInstances.length = 0;
  });

  it('crée une instance Chart.js sur le canvas avec le type et les données', async () => {
    await renderChart({ inputs: inputs() });

    expect(chartJsInstances).toHaveLength(1);
    const [chart] = chartJsInstances;
    expect(chart.canvas).toBe(screen.getByRole('img'));
    expect(chart.config.type).toBe('bar');
    expect(chart.config.data).toEqual(chartData);
  });

  it('applique les options responsive par défaut', async () => {
    await renderChart({ inputs: inputs() });

    expect(chartJsInstances[0].config.options).toEqual({
      responsive: true,
      maintainAspectRatio: false,
    });
  });

  it('laisse les options du consommateur surcharger les valeurs par défaut', async () => {
    await renderChart({
      inputs: inputs({
        options: { maintainAspectRatio: true, plugins: { legend: { display: false } } },
      }),
    });

    expect(chartJsInstances[0].config.options).toEqual({
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
    });
  });

  it('ne crée qu une seule instance au rendu initial', async () => {
    const { detectChanges } = await renderChart({ inputs: inputs() });

    detectChanges();

    expect(chartJsInstances).toHaveLength(1);
  });

  it('met à jour le graphique existant quand les données changent', async () => {
    const { fixture } = await renderChart({ inputs: inputs() });
    const [chart] = chartJsInstances;

    setInputs(fixture, { data: otherChartData });

    expect(chartJsInstances).toHaveLength(1);
    expect(chart.update).toHaveBeenCalledTimes(1);
    expect(chart.config.data).toEqual(otherChartData);
  });

  it('met à jour les options fusionnées sans recréer le graphique', async () => {
    const { fixture } = await renderChart({ inputs: inputs() });
    const [chart] = chartJsInstances;

    setInputs(fixture, { options: { plugins: { legend: { display: false } } } });

    expect(chartJsInstances).toHaveLength(1);
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

    await renderChart({ inputs: inputs({ data: source }) });
    values.push(99);

    expect(chartJsInstances[0].config.data.datasets[0]).toEqual({
      label: 'Charge',
      data: [40, 55],
    });
  });

  it('accepte des données contenant une option scriptable et la transmet à Chart.js', async () => {
    const scripted: ChartData = {
      labels: ['Lun'],
      datasets: [{ label: 'Charge', data: [40], backgroundColor: () => 'transparent' }],
    };

    await renderChart({ inputs: inputs({ data: scripted }) });

    expect(chartJsInstances).toHaveLength(1);
    expect(chartJsInstances[0].config.data.datasets[0]).toMatchObject({
      backgroundColor: expect.any(Function),
    });
  });

  it('détruit puis recrée le graphique quand le type change', async () => {
    const { fixture } = await renderChart({ inputs: inputs() });
    const [previous] = chartJsInstances;

    setInputs(fixture, { type: 'line' });

    expect(previous.destroy).toHaveBeenCalledTimes(1);
    expect(chartJsInstances).toHaveLength(2);
    expect(chartJsInstances[1].config.type).toBe('line');
  });

  it('détruit l instance Chart.js quand le composant est détruit', async () => {
    const { fixture } = await renderChart({ inputs: inputs() });
    const [chart] = chartJsInstances;

    fixture.destroy();

    expect(chart.destroy).toHaveBeenCalledTimes(1);
  });

  it('donne au canvas le nom accessible passé en entrée', async () => {
    await renderChart({ inputs: inputs() });

    expect(screen.getByRole('img', { name: LABEL })).toBeInTheDocument();
  });

  it('affiche le message d état vide à la place du graphique sans jeu de données', async () => {
    await renderChart({ inputs: inputs({ data: emptyChartData }) });

    expect(await screen.findByRole('status')).toHaveTextContent('Aucune donnée à afficher');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('considère vide un jeu de données dont toutes les valeurs sont nulles', async () => {
    await renderChart({ inputs: inputs({ data: nullChartData }) });

    expect(await screen.findByRole('status')).toHaveTextContent('Aucune donnée à afficher');
    expect(chartJsInstances).toHaveLength(0);
  });

  it('ne crée aucune instance Chart.js sans donnée', async () => {
    await renderChart({ inputs: inputs({ data: emptyChartData }) });

    expect(chartJsInstances).toHaveLength(0);
  });

  it('crée le graphique quand des données arrivent après un état vide', async () => {
    const { fixture } = await renderChart({ inputs: inputs({ data: emptyChartData }) });

    setInputs(fixture, { data: chartData });

    expect(chartJsInstances).toHaveLength(1);
    expect(screen.getByRole('img', { name: LABEL })).toBeInTheDocument();
    expect(screen.queryByText('Aucune donnée à afficher')).not.toBeInTheDocument();
  });

  it('détruit le graphique quand les données deviennent vides', async () => {
    const { fixture } = await renderChart({ inputs: inputs() });
    const [chart] = chartJsInstances;

    setInputs(fixture, { data: emptyChartData });

    expect(chart.destroy).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('status')).toHaveTextContent('Aucune donnée à afficher');
  });
});

describe('chart-registry', () => {
  it('enregistre uniquement les contrôleurs, éléments, échelles et plugins utilisés', () => {
    expect(CHART_REGISTERED_ITEMS).toEqual([
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
    ]);
  });
});
