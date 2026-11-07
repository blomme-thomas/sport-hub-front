import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ChartModel } from '../models/training-stats.model';

const EMPTY_CELL = '—';
const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

interface TableRow {
  label: string;
  cells: string[];
}

@Component({
  selector: 'sh-chart-data-table',
  templateUrl: './chart-data-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartDataTableComponent {
  readonly model = input.required<ChartModel>();

  protected readonly hasData = computed(() =>
    this.model().series.some((series) => series.values.some((value) => value !== null)),
  );

  protected readonly headers = computed(() => this.model().series.map((series) => series.label));

  protected readonly rows = computed<TableRow[]>(() => {
    const { labels, series } = this.model();
    return labels.map((label, index) => ({
      label,
      cells: series.map((item) => formatValue(item.values[index] ?? null)),
    }));
  });
}

function formatValue(value: number | null): string {
  return value === null ? EMPTY_CELL : NUMBER_FORMAT.format(value);
}
