import type {
  AdvancedMetrics,
  Effort,
  GutTolerance,
  PlanInputs,
  PlanResults,
  SodiumSensitivity,
  Weather,
} from "./types";

/** Grams of carbohydrate per kilogram of body weight per hour, by effort. */
export const CARBS_G_PER_KG_H: Record<Effort, number> = {
  low: 0.5,
  moderate: 0.8,
  high: 1.0,
  extreme: 1.2,
};

/** Millilitres of fluid per kilogram per hour, by weather. */
export const FLUIDS_ML_PER_KG_H: Record<Weather, number> = {
  cool: 5,
  moderate: 7,
  hot: 9,
  extreme: 11,
};

/** Milligrams of sodium per hour, by weather. */
export const SODIUM_MG_PER_H: Record<Weather, number> = {
  cool: 300,
  moderate: 500,
  hot: 700,
  extreme: 900,
};

/** A single carbohydrate source absorbs up to about 60 g/h; glucose plus fructose up to 90 g/h. */
export const CARB_CAP = { single: 60, dual: 90 } as const;

/**
 * A sensitive stomach stays below the usual absorption ceiling, a little higher with dual carbs.
 * Normal and iron stomachs follow the effort tables unchanged.
 */
export const GUT_CARB_CAP: Record<GutTolerance, { single: number; dual: number } | null> = {
  sensitive: { single: 60, dual: 75 },
  normal: null,
  iron: null,
};

/** How much more or less sodium a light, normal, heavy or very heavy sweater needs. */
export const SODIUM_SENSITIVITY: Record<SodiumSensitivity, number> = {
  low: 0.8,
  normal: 1,
  high: 1.2,
  very_high: 1.4,
};

/** Altitude: dry air and faster breathing raise fluid and sodium needs. */
export const ALTITUDE = { fluids: 1.15, sodium: 1.1 } as const;

/** Caffeine: about 4 mg/kg over the race, never more than 400 mg in total or 100 mg in an hour. */
export const CAFFEINE = { mgPerKg: 4, maxTotalMg: 400, maxPerHourMg: 100 } as const;

/** Extra electrolytes, per hour, when the person asks for them. */
export const ELECTROLYTES = { magnesiumMg: 75, potassiumMg: 75, calciumMg: 50 } as const;

export function carbsPerHour(
  weightKg: number,
  effort: Effort,
  dualCarb = false,
  gutTolerance: GutTolerance = "normal",
): number {
  let carbs = weightKg * CARBS_G_PER_KG_H[effort];
  // The old calculator only applied the cap on the dual-carb path, and only above 60 g/h.
  if (dualCarb && carbs > CARB_CAP.single) carbs = Math.min(carbs, CARB_CAP.dual);
  const gut = GUT_CARB_CAP[gutTolerance];
  if (gut) carbs = Math.min(carbs, dualCarb ? gut.dual : gut.single);
  return Math.round(carbs);
}

export function fluidsPerHour(
  weightKg: number,
  weather: Weather,
  altitude = false,
  sweatRateMlH?: number,
): number {
  let fluids =
    sweatRateMlH && sweatRateMlH > 0 ? sweatRateMlH : weightKg * FLUIDS_ML_PER_KG_H[weather];
  if (altitude) fluids *= ALTITUDE.fluids;
  return Math.round(fluids);
}

export function sodiumPerHour(
  weather: Weather,
  altitude = false,
  sensitivity: SodiumSensitivity = "normal",
): number {
  let sodium = SODIUM_MG_PER_H[weather] * SODIUM_SENSITIVITY[sensitivity];
  if (altitude) sodium *= ALTITUDE.sodium;
  return Math.round(sodium);
}

export function advancedMetrics(
  weightKg: number,
  durationH: number,
  caffeine = false,
  electrolytes = false,
): AdvancedMetrics {
  const out: AdvancedMetrics = {};
  if (caffeine) {
    const total = Math.min(Math.round(weightKg * CAFFEINE.mgPerKg), CAFFEINE.maxTotalMg);
    out.caffeinePerHour = Math.min(
      Math.round((weightKg * CAFFEINE.mgPerKg) / durationH),
      CAFFEINE.maxPerHourMg,
    );
    out.totalCaffeine = total;
  }
  if (electrolytes) {
    out.magnesiumPerHour = ELECTROLYTES.magnesiumMg;
    out.totalMagnesium = Math.round(ELECTROLYTES.magnesiumMg * durationH);
    out.potassiumPerHour = ELECTROLYTES.potassiumMg;
    out.totalPotassium = Math.round(ELECTROLYTES.potassiumMg * durationH);
    out.calciumPerHour = ELECTROLYTES.calciumMg;
    out.totalCalcium = Math.round(ELECTROLYTES.calciumMg * durationH);
  }
  return out;
}

/** The whole plan: per-hour needs, race totals and the optional extras. */
export function calculatePlan(inputs: PlanInputs): PlanResults {
  const carbs = carbsPerHour(inputs.weightKg, inputs.effort, inputs.dualCarb, inputs.gutTolerance);
  const fluids = fluidsPerHour(
    inputs.weightKg,
    inputs.weather,
    inputs.altitude,
    inputs.sweatRateMlH,
  );
  const sodium = sodiumPerHour(inputs.weather, inputs.altitude, inputs.sodiumSensitivity);
  return {
    durationH: inputs.durationH,
    carbsPerHour: carbs,
    fluidsPerHour: fluids,
    sodiumPerHour: sodium,
    totalCarbs: Math.round(carbs * inputs.durationH),
    totalFluids: Math.round(fluids * inputs.durationH),
    totalSodium: Math.round(sodium * inputs.durationH),
    advanced: advancedMetrics(
      inputs.weightKg,
      inputs.durationH,
      inputs.caffeine,
      inputs.electrolytes,
    ),
  };
}

/** Carb loading in the three days before: 10 g per kg per day. */
export function carbLoadingPerDay(weightKg: number): number {
  return Math.round(weightKg * 10);
}

/** Recovery in the first hour after: 1.2 g/kg carbs, 0.3 g/kg protein, 25 ml/kg fluids. */
export function recovery(weightKg: number) {
  return {
    carbsG: Math.round(weightKg * 1.2),
    proteinG: Math.round(weightKg * 0.3),
    fluidsMl: Math.round(weightKg * 25),
  };
}

/** Glucose to fructose split for a dual-carb plan: 60/40. */
export function dualCarbSplit(carbsPerHourG: number) {
  return {
    glucoseG: Math.round(carbsPerHourG * 0.6),
    fructoseG: Math.round(carbsPerHourG * 0.4),
  };
}

export type TimelineHour = {
  hour: number;
  carbsG: number;
  fluidsMl: number;
  sodiumMg: number;
  /** Between 22:00 and 04:00 on a night race: carbs ×0.7, fluids ×0.8. */
  night: boolean;
};

/** Hour-by-hour intake, at most 24 rows; longer races repeat the pattern. */
export function hourlyTimeline(results: PlanResults, nightRace = false): TimelineHour[] {
  const rows: TimelineHour[] = [];
  const hours = Math.min(Math.floor(results.durationH), 24);
  for (let hour = 1; hour <= hours; hour++) {
    const clock = hour % 24;
    const night = nightRace && (clock >= 22 || clock <= 4);
    rows.push({
      hour,
      carbsG: night ? Math.round(results.carbsPerHour * 0.7) : results.carbsPerHour,
      fluidsMl: night ? Math.round(results.fluidsPerHour * 0.8) : results.fluidsPerHour,
      sodiumMg: results.sodiumPerHour,
      night,
    });
  }
  return rows;
}

export type CaffeineProtocol = {
  /** 0.5 mg per kg per dose. */
  doseMg: number;
  /** Hour 1, then every fourth hour. */
  hours: number[];
  totalMg: number;
};

export function caffeineProtocol(weightKg: number, durationH: number): CaffeineProtocol {
  const doseMg = Math.round(weightKg * 0.5);
  const hours: number[] = [];
  for (let hour = 1; hour <= Math.floor(durationH); hour++) {
    if (hour === 1 || hour % 4 === 0) hours.push(hour);
  }
  return { doseMg, hours, totalMg: doseMg * hours.length };
}

/** Unit prices the budget estimate uses, in US dollars. Config, not science. */
export const FUEL_PRICES = { gel: 2.5, chews: 2, bottle: 3, banana: 0.5 } as const;

/** Rough spend for the race by strategy, rounded to whole dollars. */
export function costEstimate(results: PlanResults) {
  const h = results.durationH;
  const gels = Math.ceil(results.carbsPerHour / 25) * h * FUEL_PRICES.gel;
  const chews = Math.ceil(results.carbsPerHour / 30) * h * FUEL_PRICES.chews;
  const drink = Math.ceil(results.fluidsPerHour / 500) * h * FUEL_PRICES.bottle;
  const realFood = Math.ceil(results.carbsPerHour / 27) * h * FUEL_PRICES.banana;
  const premium = Math.round(gels + drink);
  const budget = Math.round(chews + drink * 0.5);
  const real = Math.round(realFood + drink * 0.3);
  return {
    premium,
    budget,
    realFood: real,
    perHour: { high: Math.round(premium / h), low: Math.round(budget / h) },
    aidStations: Math.ceil(h / 4),
  };
}
