import { TestBed } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chartJsInstances } from '../../../../mocks/chart-js.fake';
import type { ChartModel } from '../models/training-stats.model';
import { ChartCardComponent } from './chart-card.component';

vi.mock('chart.js', async () => (await import('../../../../mocks/chart-js.fake')).chartJsModule);

const TITLE = 'Séances par semaine';
const CHART_TIMEOUT_MS = 5000;

const chartModel: ChartModel = {
  title: TITLE,
  labels: ['S43', 'S44'],
  series: [{ label: 'Séances', values: [2, 4], cssVar: '--sh-chart-series-1' }],
  unit: 'séances',
};

const emptyChartModel: ChartModel = {
  ...chartModel,
  series: [{ label: 'Séances', values: [null, null], cssVar: '--sh-chart-series-1' }],
};

describe('ChartCardComponent', () => {
  beforeEach(() => {
    chartJsInstances.length = 0;
  });

  it('affiche le titre du graphique et un bouton Agrandir qui le nomme', async () => {
    await render(ChartCardComponent, { inputs: { model: chartModel } });

    expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Agrandir le graphique : ${TITLE}` }),
    ).toBeInTheDocument();
  });

  it('émet expand au clic sur le bouton Agrandir', async () => {
    const expand = vi.fn();
    await render(ChartCardComponent, { inputs: { model: chartModel }, on: { expand } });

    await userEvent.click(screen.getByRole('button', { name: `Agrandir le graphique : ${TITLE}` }));

    expect(expand).toHaveBeenCalledTimes(1);
  });

  it('transmet les libellés et les valeurs du modèle à Chart.js', async () => {
    await render(ChartCardComponent, { inputs: { model: chartModel } });

    // Chart.js est créé de façon asynchrone après le rendu : on attend l'instance avant de la lire.
    // Délai allongé : sur un runner CI chargé, la création dépasse le délai par défaut d'une seconde.
    await vi.waitFor(
      () => {
        TestBed.tick();
        expect(chartJsInstances).toHaveLength(1);
      },
      { timeout: CHART_TIMEOUT_MS },
    );
    const [chart] = chartJsInstances;
    expect(chart?.config.data.labels).toEqual(['S43', 'S44']);
    expect(chart?.config.data.datasets).toEqual([
      expect.objectContaining({ label: 'Séances', data: [2, 4] }),
    ]);
  });

  it('nomme le graphique par son titre pour les lecteurs d écran', async () => {
    await render(ChartCardComponent, { inputs: { model: chartModel } });

    expect(screen.getByRole('img', { name: TITLE })).toBeInTheDocument();
  });

  it('dessine un graphique horizontal à barres quand le type demandé est horizontal-bar', async () => {
    await render(ChartCardComponent, {
      inputs: { model: chartModel, kind: 'horizontal-bar' },
    });

    await vi.waitFor(
      () => {
        TestBed.tick();
        expect(chartJsInstances).toHaveLength(1);
      },
      { timeout: CHART_TIMEOUT_MS },
    );
    expect(chartJsInstances[0]?.config.type).toBe('bar');
    expect(chartJsInstances[0]?.config.options).toMatchObject({ indexAxis: 'y' });
  });

  it('affiche un tableau récapitulatif des libellés et des valeurs', async () => {
    await render(ChartCardComponent, { inputs: { model: chartModel } });

    const table = screen.getByRole('table');
    expect(within(table).getByText('S44')).toBeInTheDocument();
    expect(within(table).getByText('4')).toBeInTheDocument();
  });

  it('affiche un état vide explicite quand toutes les valeurs sont nulles', async () => {
    await render(ChartCardComponent, { inputs: { model: emptyChartModel } });

    expect(await screen.findByRole('status')).toHaveTextContent('Aucune donnée à afficher');
  });
});
