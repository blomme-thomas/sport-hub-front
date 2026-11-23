import type { FoodApi, FoodRequestApi } from '../models/food.api-model';
import type { Food, FoodInput } from '../models/food.model';

export function toFood(api: FoodApi): Food {
  return {
    id: api.id,
    name: api.name,
    unit: api.unit,
    categories: [...api.categories],
    calories: api.calories,
    proteins: api.proteins,
    carbohydrates: api.carbohydrates,
    fats: api.fats,
    sugars: api.sugars,
  };
}

export function toFoodRequest(input: FoodInput): FoodRequestApi {
  return {
    name: input.name,
    unit: input.unit,
    categories: [...input.categories],
    calories: input.calories,
    proteins: input.proteins,
    carbohydrates: input.carbohydrates,
    fats: input.fats,
    sugars: input.sugars,
  };
}
