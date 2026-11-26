import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TEXTS, fill } from '@shared/texts/texts';
import { type MacroKey, macroEnergyShares } from '@shared/utils/macro-split';
import { formatNutrient } from '@shared/utils/nutrient-format';

/** Couleur de chaque macro dans l'anneau et dans la légende. */
const SEGMENT_COLOR: Record<MacroKey, string> = {
  proteins: 'var(--sh-accent-text)',
  carbohydrates: 'var(--sh-orange)',
  fats: 'var(--sh-warning)',
};

/**
 * Anneau des calories, avec la valeur au centre, et répartition protéines, glucides et lipides en dessous.
 * Les pourcentages sont en énergie (4, 4 et 9 kcal/g). La légende porte le nom de chaque macro, suivi de sa
 * quantité en grammes, et à droite son pourcentage.
 */
@Component({
  selector: 'sh-macro-split',
  templateUrl: './macro-split.component.html',
  styleUrl: './macro-split.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MacroSplitComponent {
  readonly calories = input<number | null>(null);
  readonly proteins = input<number | null>(null);
  readonly carbohydrates = input<number | null>(null);
  readonly fats = input<number | null>(null);
  /** Affiche la légende (nom, grammes, pourcentage) sous ou à côté de l'anneau. */
  readonly legend = input(true);

  protected readonly t = TEXTS;

  protected readonly shares = computed(() =>
    macroEnergyShares({
      proteins: this.proteins(),
      carbohydrates: this.carbohydrates(),
      fats: this.fats(),
    }),
  );

  /** Fond de l'anneau : un secteur par macro, ou un anneau vide sans énergie à répartir. */
  protected readonly ring = computed(() => {
    const shares = this.shares();
    if (shares === null) {
      return 'var(--sh-surface-raised)';
    }
    let start = 0;
    const stops = shares.map((share, index) => {
      const end = index === shares.length - 1 ? 100 : start + share.percent;
      const stop = `${SEGMENT_COLOR[share.key]} ${start}% ${end}%`;
      start = end;
      return stop;
    });
    return `conic-gradient(${stops.join(', ')})`;
  });

  protected readonly kcalValue = computed(() =>
    formatNutrient(this.calories(), this.t.nutrition.recipes.noValue),
  );

  protected readonly ariaLabel = computed(() => {
    const shares = this.shares();
    if (shares === null) {
      return this.t.macros.empty;
    }
    const summary = shares
      .map((share) =>
        fill(this.t.macros.summaryItem, {
          label: this.labelOf(share.key),
          percent: share.percent,
        }),
      )
      .join(', ');
    return fill(this.t.macros.ariaLabel, { summary });
  });

  protected labelOf(key: MacroKey): string {
    return this.t.macros[key];
  }

  protected gramsOf(grams: number | null): string {
    return formatNutrient(grams, this.t.nutrition.recipes.noValue, 'g');
  }
}
