import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Petite roue discrète, affichée dans le coin haut-droit de son conteneur (qui doit être `position: relative`)
 * pendant un rechargement. Décorative : le conteneur porte le `aria-busy`.
 */
@Component({
  selector: 'sh-spinner',
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  readonly busy = input(false);
}
