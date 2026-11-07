import { Component, ViewContainerRef, inject } from '@angular/core';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NZ_MODAL_DATA, NzModalService } from 'ng-zorro-antd/modal';
import { describe, expect, it, vi } from 'vitest';
import { normalStatsResponse } from '../../../../mocks/fixtures/training-stats.fixtures';
import { statsTestProviders, trackStats } from '../../../../mocks/training-stats.testing';
import { DashboardState } from '../data-access/dashboard.state';
import { TrainingStatsApi } from '../data-access/training-stats.api';
import { toDashboardView } from '../data-access/training-stats.mapper';
import type { ChartKey } from '../models/training-stats.model';
import { ChartCardComponent } from './chart-card.component';
import { ChartModalComponent } from './chart-modal.component';

vi.mock('chart.js', async () => (await import('../../../../mocks/chart-js.fake')).chartJsModule);

const view = toDashboardView(normalStatsResponse);
const SESSIONS_TITLE = view.charts.sessions.title;

function contentProviders(chart: ChartKey = 'sessions') {
  return [
    ...statsTestProviders(),
    TrainingStatsApi,
    DashboardState,
    { provide: NZ_MODAL_DATA, useValue: { chart } },
  ];
}

describe('ChartModalComponent', () => {
  it('affiche le graphique demandé en grand, nommé par son titre', async () => {
    trackStats();

    await render(ChartModalComponent, { providers: contentProviders('sessions') });

    expect(await screen.findByRole('img', { name: SESSIONS_TITLE })).toBeInTheDocument();
  });

  it('affiche un tableau récapitulatif des valeurs du graphique', async () => {
    trackStats();

    await render(ChartModalComponent, { providers: contentProviders('sessions') });

    const table = await screen.findByRole('table');
    expect(within(table).getByText(view.charts.sessions.labels[0] ?? '')).toBeInTheDocument();
  });

  it('affiche le sélecteur de granularité dans la modale', async () => {
    trackStats();

    await render(ChartModalComponent, { providers: contentProviders('sessions') });

    expect(await screen.findByRole('radiogroup', { name: 'Granularité' })).toBeInTheDocument();
  });

  it('relance la lecture avec la granularité choisie depuis la modale', async () => {
    const requests = trackStats();
    await render(ChartModalComponent, { providers: contentProviders('sessions') });
    await screen.findByRole('img', { name: SESSIONS_TITLE });

    await userEvent.click(screen.getByRole('radio', { name: 'Mois' }));

    await waitFor(() => {
      expect(requests.at(-1)?.searchParams.get('granularity')).toBe('month');
    });
  });
});

@Component({
  selector: 'sh-test-dashboard-host',
  imports: [ChartCardComponent],
  providers: [DashboardState],
  template: `
    @if (state.view(); as view) {
      <sh-chart-card [model]="view.charts.sessions" (expand)="open()" />
    }
  `,
})
class DashboardHostComponent {
  protected readonly state = inject(DashboardState);
  private readonly modal = inject(NzModalService);
  private readonly viewContainer = inject(ViewContainerRef);

  protected open(): void {
    const title = this.state.view()?.charts.sessions.title ?? '';
    const ref = this.modal.create({
      nzTitle: title,
      nzContent: ChartModalComponent,
      nzData: { chart: 'sessions' },
      nzViewContainerRef: this.viewContainer,
      nzKeyboard: true,
      nzFooter: [{ label: 'Fermer', onClick: () => ref.close() }],
    });
  }
}

describe('ouverture de la modale depuis une carte', () => {
  async function renderHost() {
    const requests = trackStats();
    await render(DashboardHostComponent, { providers: statsTestProviders() });
    const card = await screen.findByRole('button', {
      name: `Agrandir le graphique : ${SESSIONS_TITLE}`,
    });
    return { requests, card, user: userEvent.setup() };
  }

  it('ouvre la modale avec le graphique agrandi sans nouvel appel au back', async () => {
    const { requests, card, user } = await renderHost();

    await user.click(card);

    expect(await screen.findByRole('dialog', { name: SESSIONS_TITLE })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: SESSIONS_TITLE })).toBeInTheDocument();
    expect(requests).toHaveLength(1);
  });

  it('ferme la modale avec la touche Échap et restitue le focus à la carte', async () => {
    const { card, user } = await renderHost();
    await user.click(card);
    await screen.findByRole('dialog', { name: SESSIONS_TITLE });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(card).toHaveFocus();
  });

  it('ferme la modale avec le bouton Fermer et restitue le focus à la carte', async () => {
    const { card, user } = await renderHost();
    await user.click(card);
    await screen.findByRole('dialog', { name: SESSIONS_TITLE });

    await user.click(screen.getByRole('button', { name: 'Fermer' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(card).toHaveFocus();
  });
});
