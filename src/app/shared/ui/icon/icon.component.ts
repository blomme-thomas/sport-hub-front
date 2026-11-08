import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Pictogrammes du tableau de bord, dessinés en SVG (trait, couleur héritée du parent). */
export type IconName =
  'calendar' | 'clock' | 'flame' | 'mountain' | 'heart' | 'bars' | 'pie' | 'list' | 'flag';

/** Icône décorative : le libellé qui l'accompagne porte l'information, donc elle est masquée aux lecteurs d'écran. */
@Component({
  selector: 'sh-icon',
  template: `
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      @switch (name()) {
        @case ('calendar') {
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        }
        @case ('flame') {
          <path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z" />
        }
        @case ('mountain') {
          <path d="M3 20l6-10 4 6 3-4 5 8z" />
        }
        @case ('heart') {
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
        }
        @case ('bars') {
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        }
        @case ('pie') {
          <path d="M21 12A9 9 0 1 1 12 3v9z" />
          <path d="M15 3.5A9 9 0 0 1 20.5 9H15z" />
        }
        @case ('list') {
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        }
        @case ('flag') {
          <path d="M5 21V4M5 4h12l-2 4 2 4H5" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1.5rem;
      height: 1.5rem;
    }

    svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  host: { '[style.color]': 'color()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  /** Couleur CSS (ex. `var(--sh-violet)`) ; `null` = couleur héritée du parent. */
  readonly color = input<string | null>(null);
}
