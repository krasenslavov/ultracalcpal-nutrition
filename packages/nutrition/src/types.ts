/** How hard the race is run. Zones 1-2, 3, 4 and 5+ in the old calculator. */
export type Effort = "low" | "moderate" | "high" | "extreme";

/** Expected conditions: under 10 °C, 10-20, 20-30, over 30. */
export type Weather = "cool" | "moderate" | "hot" | "extreme";

export type SodiumSensitivity = "low" | "normal" | "high" | "very_high";
export type Experience = "beginner" | "intermediate" | "veteran";
export type GutTolerance = "sensitive" | "normal" | "iron";

/** What the person enters. Weight is always kilograms inside; convert at the edge (units.ts). */
export type PlanInputs = {
  weightKg: number;
  durationH: number;
  effort: Effort;
  weather: Weather;
  /** Glucose plus fructose: lifts the absorption cap from 60 to 90 g/h. */
  dualCarb?: boolean;
  /** Race above about 2000 m. */
  altitude?: boolean;
  caffeine?: boolean;
  electrolytes?: boolean;
  /** Fuel ideas as bananas, dates and bars instead of gels and chews. */
  realFood?: boolean;
  /** Overnight or multi-day: lower intake between 22:00 and 04:00. */
  nightRace?: boolean;
  /** A measured sweat rate in ml/h, which replaces the weight-based fluid estimate. */
  sweatRateMlH?: number;
  /** Collected for the profile; they do not change the numbers yet (see the brief). */
  sodiumSensitivity?: SodiumSensitivity;
  experience?: Experience;
  gutTolerance?: GutTolerance;
};

export type HourlyNeeds = {
  carbsPerHour: number;
  fluidsPerHour: number;
  sodiumPerHour: number;
};

export type AdvancedMetrics = {
  caffeinePerHour?: number;
  totalCaffeine?: number;
  magnesiumPerHour?: number;
  totalMagnesium?: number;
  potassiumPerHour?: number;
  totalPotassium?: number;
  calciumPerHour?: number;
  totalCalcium?: number;
};

export type PlanResults = HourlyNeeds & {
  durationH: number;
  totalCarbs: number;
  totalFluids: number;
  totalSodium: number;
  advanced: AdvancedMetrics;
};
