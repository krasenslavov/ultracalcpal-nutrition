export type {
  AdvancedMetrics,
  Effort,
  Experience,
  GutTolerance,
  HourlyNeeds,
  PlanInputs,
  PlanResults,
  SodiumSensitivity,
  Weather,
} from "./types";
export {
  ALTITUDE,
  CAFFEINE,
  CARBS_G_PER_KG_H,
  CARB_CAP,
  ELECTROLYTES,
  FLUIDS_ML_PER_KG_H,
  FUEL_PRICES,
  GUT_CARB_CAP,
  SODIUM_SENSITIVITY,
  SODIUM_MG_PER_H,
  advancedMetrics,
  caffeineProtocol,
  calculatePlan,
  carbLoadingPerDay,
  carbsPerHour,
  costEstimate,
  dualCarbSplit,
  fluidsPerHour,
  hourlyTimeline,
  recovery,
  sodiumPerHour,
  type CaffeineProtocol,
  type TimelineHour,
} from "./calculator";
export { SERVINGS, fuelOptions, mixedStrategy, type FuelKind, type FuelOption } from "./fuel";
export {
  dropBags,
  sortStations,
  stationSegments,
  type AidStation,
  type DistanceUnit,
  type DropBag,
  type DropBagItem,
  type Segment,
} from "./aid-stations";
export {
  HEAT_MULTIPLIERS,
  dewPointC,
  heatIndexC,
  heatStressLevel,
  wbgtC,
  weatherAdjustments,
  type HeatStress,
  type WeatherAdjustment,
} from "./weather";
export { riskFlags, type Forecast, type Risk, type RiskCode } from "./risks";
export { variance, type ActualIntake, type Variance } from "./review";
export { KM_PER_MI, LB_PER_KG, cToF, fToC, kgToLb, kmToMi, lbToKg, miToKm, round1 } from "./units";
