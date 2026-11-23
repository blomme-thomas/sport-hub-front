import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { TEXTS } from '@shared/texts/texts';
import {
  CARBS_GRAMS_MAX,
  CARBS_GRAMS_MIN,
  HYDRATION_MILLILITERS_MAX,
  HYDRATION_MILLILITERS_MIN,
  SESSION_CARBS_UNITS,
  type SessionNutritionForm,
} from '../../nutrition/session-nutrition';

/**
 * Champs facultatifs de la nutrition d'une séance : glucides (grammes), unité des glucides, hydratation
 * (millilitres). Les règles sont dans le groupe (`session-nutrition.ts`) ; ce composant ne fait que les afficher.
 */
@Component({
  selector: 'sh-session-nutrition-fields',
  imports: [ReactiveFormsModule, NzInputDirective],
  templateUrl: './session-nutrition-fields.component.html',
  styleUrl: './session-nutrition-fields.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionNutritionFieldsComponent {
  /** Groupe créé par `createSessionNutritionForm`, rattaché au formulaire parent. */
  readonly group = input.required<SessionNutritionForm>();
  /** Préfixe des identifiants HTML, pour éviter les collisions entre deux formulaires ouverts. */
  readonly idPrefix = input('session-nutrition');

  protected readonly t = TEXTS;
  protected readonly units = SESSION_CARBS_UNITS;
  protected readonly carbsRange = { min: CARBS_GRAMS_MIN, max: CARBS_GRAMS_MAX };
  protected readonly hydrationRange = {
    min: HYDRATION_MILLILITERS_MIN,
    max: HYDRATION_MILLILITERS_MAX,
  };
}
