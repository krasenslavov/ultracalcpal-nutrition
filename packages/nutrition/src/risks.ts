import type { PlanInputs, PlanResults } from "./types";
import { cToF } from "./units";
import { heatStressLevel, type HeatStress } from "./weather";

/** A forecast for the race, when one is known. */
export type Forecast = { heatIndexC: number; humidity: number; wbgtC?: number };

export type RiskCode =
  | "high-carbs"
  | "heat-forecast"
  | "heat-manual"
  | "altitude"
  | "long-duration"
  | "hyponatremia"
  | "caffeine"
  | "first-ultras";

export type Risk = {
  code: RiskCode;
  severity: "moderate" | "high" | "extreme";
  /** Numbers the UI drops into the explanation; the words live in the app's messages. */
  data: Record<string, number | boolean>;
};

const heatSeverity = (level: HeatStress): Risk["severity"] =>
  level === "extreme" ? "extreme" : level === "high" ? "high" : "moderate";

/** The warnings the old calculator raised, as codes the app translates. Order is the display order. */
export function riskFlags(
  inputs: PlanInputs,
  results: PlanResults,
  forecast?: Forecast | null,
): Risk[] {
  const risks: Risk[] = [];

  if (results.carbsPerHour > 80) {
    risks.push({
      code: "high-carbs",
      severity: "moderate",
      data: { carbsPerHour: results.carbsPerHour, fallback: 60 },
    });
  }

  if (forecast && heatStressLevel(forecast.heatIndexC) !== "low") {
    const level = heatStressLevel(forecast.heatIndexC);
    const fluids = level === "moderate" ? 1.15 : 1.3;
    const sodium = level === "moderate" ? 1.2 : 1.4;
    risks.push({
      code: "heat-forecast",
      severity: heatSeverity(level),
      data: {
        heatIndexC: forecast.heatIndexC,
        heatIndexF: Math.round(cToF(forecast.heatIndexC)),
        humidity: forecast.humidity,
        wbgtC: forecast.wbgtC ?? 0,
        humid: forecast.humidity > 80,
        fluidsPerHour: Math.round(results.fluidsPerHour * fluids),
        sodiumPerHour: Math.round(results.sodiumPerHour * sodium),
      },
    });
  } else if (!forecast && (inputs.weather === "hot" || inputs.weather === "extreme")) {
    risks.push({
      code: "heat-manual",
      severity: inputs.weather === "extreme" ? "high" : "moderate",
      data: { fluidsPerHour: results.fluidsPerHour },
    });
  }

  if (inputs.altitude) {
    risks.push({ code: "altitude", severity: "moderate", data: {} });
  }

  if (inputs.durationH > 12) {
    risks.push({
      code: "long-duration",
      severity: "moderate",
      data: { nightRace: Boolean(inputs.nightRace) },
    });
  }

  if (results.fluidsPerHour > 800 && results.sodiumPerHour < 500) {
    risks.push({
      code: "hyponatremia",
      severity: "high",
      data: { sodiumPerHour: results.sodiumPerHour, targetLow: 600, targetHigh: 800 },
    });
  }

  if (inputs.caffeine) {
    risks.push({
      code: "caffeine",
      severity: "moderate",
      data: { maxTotalMg: 400, maxDoseMg: 200 },
    });
  }

  // A first-timer on a big plan: everything above should be rehearsed in training first.
  if (inputs.experience === "beginner" && (results.carbsPerHour > 60 || inputs.durationH > 12)) {
    risks.push({
      code: "first-ultras",
      severity: "moderate",
      data: { carbsPerHour: results.carbsPerHour, durationH: inputs.durationH },
    });
  }

  return risks;
}
