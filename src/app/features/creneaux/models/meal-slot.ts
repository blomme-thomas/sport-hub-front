/** Repas d'une journée dans le calendrier alimentation, du haut vers le bas. Le mode n'a pas d'heures. */
export const MEAL_SLOTS = ['matin', 'midi', 'soir'] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number];
