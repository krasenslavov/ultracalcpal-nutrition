import type { HourlyNeeds } from "./types";

/** Typical carbohydrate per serving, in grams, and the size of a bottle and a salt capsule. */
export const SERVINGS = {
  gelG: 25,
  chewsG: 30,
  /** One scoop of drink mix in 300 ml. */
  scoopG: 30,
  bananaG: 27,
  dateG: 18,
  barG: 40,
  bottleMl: 500,
  saltCapMg: 215,
} as const;

export type FuelKind = "gels" | "chews" | "drink" | "bananas" | "dates" | "bars";

export type FuelOption = {
  kind: FuelKind;
  /** Servings per hour (for `drink`: scoops per hour, with `fluidsMl` the drink volume). */
  perHour: number;
  carbsG: number;
  fluidsMl?: number;
};

/** What an hour's carbs look like as products, or as real food. */
export function fuelOptions(needs: HourlyNeeds, realFood = false): FuelOption[] {
  const c = needs.carbsPerHour;
  if (realFood) {
    return [
      { kind: "bananas", perHour: Math.ceil(c / SERVINGS.bananaG), carbsG: c },
      { kind: "dates", perHour: Math.ceil(c / SERVINGS.dateG), carbsG: c },
      { kind: "bars", perHour: Math.ceil(c / SERVINGS.barG), carbsG: c },
    ];
  }
  return [
    { kind: "gels", perHour: Math.ceil(c / SERVINGS.gelG), carbsG: c },
    { kind: "chews", perHour: Math.ceil(c / SERVINGS.chewsG), carbsG: c },
    {
      kind: "drink",
      perHour: Math.ceil((c / 60) * 2),
      carbsG: c,
      fluidsMl: needs.fluidsPerHour,
    },
  ];
}

/** Half the carbs from gels, the other half from chews or a banana; fluids split drink and water. */
export function mixedStrategy(needs: HourlyNeeds, realFood = false) {
  return {
    gelsPerHour: Math.ceil(needs.carbsPerHour / 2 / SERVINGS.gelG),
    sideKind: realFood ? ("bananas" as const) : ("chews" as const),
    drinkMl: Math.round(needs.fluidsPerHour / 2),
    waterMl: Math.round(needs.fluidsPerHour / 2),
  };
}
