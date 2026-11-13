import type { HourlyNeeds } from "./types";

/** What the runner actually took in, per hour, written down after the race. */
export type ActualIntake = {
  carbsPerHour?: number | null;
  fluidsPerHour?: number | null;
  sodiumPerHour?: number | null;
};

export type Variance = {
  carbs?: { delta: number; percent: number };
  fluids?: { delta: number; percent: number };
  sodium?: { delta: number; percent: number };
};

const diff = (actual: number, planned: number) => ({
  delta: actual - planned,
  percent: planned === 0 ? 0 : Math.round(((actual - planned) / planned) * 100),
});

/** Actual against planned, for the numbers that were recorded. */
export function variance(planned: HourlyNeeds, actual: ActualIntake): Variance {
  const out: Variance = {};
  if (actual.carbsPerHour != null) out.carbs = diff(actual.carbsPerHour, planned.carbsPerHour);
  if (actual.fluidsPerHour != null) out.fluids = diff(actual.fluidsPerHour, planned.fluidsPerHour);
  if (actual.sodiumPerHour != null) out.sodium = diff(actual.sodiumPerHour, planned.sodiumPerHour);
  return out;
}
