import { describe, expect, it } from 'vitest';
import {
  GOOD_BALANCE_MESSAGE,
  GOOD_BALANCE_THRESHOLD_PERCENT,
  REBALANCE_MESSAGE,
  toZonesCardView,
} from './zones-card.mapper';

describe('toZonesCardView', () => {
  it('calcule le pourcentage de chaque zone et l’associe à sa couleur', () => {
    const view = toZonesCardView([100, 300, 400, 150, 50]);

    expect(view.zones.map((zone) => [zone.label, zone.percent, zone.colorVariable])).toEqual([
      ['Z1', 10, '--sh-text-muted'],
      ['Z2', 30, '--sh-success'],
      ['Z3', 40, '--sh-orange'],
      ['Z4', 15, '--sh-danger'],
      ['Z5', 5, '--sh-violet'],
    ]);
  });

  it('exprime la zone optimale comme la somme de Z2 et Z3', () => {
    const view = toZonesCardView([100, 300, 400, 150, 50]);

    expect(view.optimalPercent).toBe(70);
  });

  it('affiche le message d’équilibre à partir du seuil', () => {
    const atThreshold = toZonesCardView([40, 60, 0, 0, 0]);

    expect(atThreshold.optimalPercent).toBe(GOOD_BALANCE_THRESHOLD_PERCENT);
    expect(atThreshold.statusMessage).toBe(GOOD_BALANCE_MESSAGE);
  });

  it('affiche le message de renforcement sous le seuil', () => {
    const view = toZonesCardView([600, 100, 100, 100, 100]);

    expect(view.optimalPercent).toBe(20);
    expect(view.statusMessage).toBe(REBALANCE_MESSAGE);
  });

  it('traite une zone null comme absente, sans l’afficher comme une valeur', () => {
    const view = toZonesCardView([null, 200, 200, null, null]);

    expect(view.zones.map((zone) => zone.percent)).toEqual([0, 50, 50, 0, 0]);
  });

  it('renvoie une vue vide sans donnée, sans valeur fictive', () => {
    expect(toZonesCardView([null, null, null, null, null])).toEqual({
      zones: [],
      optimalPercent: null,
      statusMessage: null,
    });
    expect(toZonesCardView([0, 0, 0, 0, 0]).zones).toEqual([]);
  });
});
