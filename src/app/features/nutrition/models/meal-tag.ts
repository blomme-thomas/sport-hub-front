/** Repas auxquels une recette peut être associée (`MEAL_TAGS` du back). */
export const MEAL_TAGS = ['matin', 'midi', 'soir'] as const;

export type MealTag = (typeof MEAL_TAGS)[number];
