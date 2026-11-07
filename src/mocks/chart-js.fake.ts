import { vi } from 'vitest';

export interface FakeChartConfig {
  type: string;
  data: { labels?: unknown[]; datasets: unknown[] };
  options: unknown;
}

export const chartJsInstances: FakeChart[] = [];

export class FakeChart {
  static readonly register = vi.fn();

  readonly update = vi.fn();
  readonly destroy = vi.fn();
  readonly config: FakeChartConfig;

  constructor(
    readonly canvas: HTMLCanvasElement,
    config: FakeChartConfig,
  ) {
    this.config = config;
    chartJsInstances.push(this);
  }

  get data(): FakeChartConfig['data'] {
    return this.config.data;
  }

  set data(data: FakeChartConfig['data']) {
    this.config.data = data;
  }

  get options(): unknown {
    return this.config.options;
  }

  set options(options: unknown) {
    this.config.options = options;
  }
}

export const chartJsModule = {
  Chart: FakeChart,
  BarController: 'BarController',
  LineController: 'LineController',
  BarElement: 'BarElement',
  LineElement: 'LineElement',
  PointElement: 'PointElement',
  CategoryScale: 'CategoryScale',
  LinearScale: 'LinearScale',
  Tooltip: 'Tooltip',
  Legend: 'Legend',
};
