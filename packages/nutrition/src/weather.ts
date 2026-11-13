import { cToF, fToC, round1 } from "./units";

/**
 * Heat index (NOAA's Rothfusz regression) from air temperature and relative humidity. Below 80 °F
 * the heat index is the temperature itself. Returns degrees Celsius to one decimal.
 */
export function heatIndexC(tempC: number, humidity: number): number {
  const t = cToF(tempC);
  const rh = humidity;
  if (t < 80) return round1(tempC);
  let hi =
    -42.379 +
    2.04901523 * t +
    10.14333127 * rh -
    0.22475541 * t * rh -
    0.00683783 * t * t -
    0.05481717 * rh * rh +
    0.00122874 * t * t * rh +
    0.00085282 * t * rh * rh -
    0.00000199 * t * t * rh * rh;
  if (rh < 13 && t >= 80 && t <= 112) {
    hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
  } else if (rh > 85 && t >= 80 && t <= 87) {
    hi += ((rh - 85) / 10) * ((87 - t) / 5);
  }
  return round1(fToC(hi));
}

/** Simplified outdoor wet-bulb globe temperature: 0.567 T + 0.393 e + 3.94, e the vapour pressure. */
export function wbgtC(tempC: number, humidity: number): number {
  const e = (humidity / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  return round1(0.567 * tempC + 0.393 * e + 3.94);
}

/** Dew point (Magnus formula). */
export function dewPointC(tempC: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidity / 100);
  return round1((b * alpha) / (a - alpha));
}

export type HeatStress = "low" | "moderate" | "high" | "extreme";

/** Bands on the heat index in Fahrenheit: under 80, under 90, under 103, and above. */
export function heatStressLevel(heatIndexCelsius: number): HeatStress {
  const f = cToF(heatIndexCelsius);
  if (f < 80) return "low";
  if (f < 90) return "moderate";
  if (f < 103) return "high";
  return "extreme";
}

export type WeatherAdjustment = {
  fluidMultiplier: number;
  sodiumMultiplier: number;
  adjustedFluids: number;
  adjustedSodium: number;
  fluidIncreasePct: number;
  sodiumIncreasePct: number;
};

/** The multipliers per heat-stress band, plus a little more when humidity is over 80 %. */
export const HEAT_MULTIPLIERS: Record<HeatStress, { fluids: number; sodium: number }> = {
  low: { fluids: 1, sodium: 1 },
  moderate: { fluids: 1.15, sodium: 1.2 },
  high: { fluids: 1.3, sodium: 1.4 },
  extreme: { fluids: 1.5, sodium: 1.6 },
};

export function weatherAdjustments(
  heatIndexCelsius: number,
  humidity: number,
  baseFluids: number,
  baseSodium: number,
): WeatherAdjustment {
  const band = HEAT_MULTIPLIERS[heatStressLevel(heatIndexCelsius)];
  let fluidMultiplier = band.fluids;
  let sodiumMultiplier = band.sodium;
  if (humidity > 80) {
    fluidMultiplier *= 1.1;
    sodiumMultiplier *= 1.15;
  }
  return {
    fluidMultiplier,
    sodiumMultiplier,
    adjustedFluids: Math.round(baseFluids * fluidMultiplier),
    adjustedSodium: Math.round(baseSodium * sodiumMultiplier),
    fluidIncreasePct: Math.round((fluidMultiplier - 1) * 100),
    sodiumIncreasePct: Math.round((sodiumMultiplier - 1) * 100),
  };
}
