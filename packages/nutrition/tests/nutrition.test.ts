import { describe, expect, it } from "vitest";
import {
  caffeineProtocol,
  calculatePlan,
  carbLoadingPerDay,
  carbsPerHour,
  costEstimate,
  dewPointC,
  dropBags,
  dualCarbSplit,
  fluidsPerHour,
  fuelOptions,
  heatIndexC,
  heatStressLevel,
  hourlyTimeline,
  kgToLb,
  lbToKg,
  mixedStrategy,
  recovery,
  riskFlags,
  sodiumPerHour,
  stationSegments,
  variance,
  wbgtC,
  weatherAdjustments,
  type AidStation,
} from "../src/index";

// Expected values come from the WordPress plugin this package replaces
// (ultra-nutrition-premium-calculator/assets/js/premium-calculator.js and friends).

describe("per-hour needs", () => {
  it("scales carbs by weight and effort", () => {
    expect(carbsPerHour(70, "low")).toBe(35);
    expect(carbsPerHour(70, "moderate")).toBe(56);
    expect(carbsPerHour(70, "high")).toBe(70);
    expect(carbsPerHour(70, "extreme")).toBe(84);
  });

  it("caps dual-carb intake at 90 g/h, and leaves single-source intake alone like the old code", () => {
    expect(carbsPerHour(80, "extreme", true)).toBe(90);
    expect(carbsPerHour(80, "extreme", false)).toBe(96);
    expect(carbsPerHour(50, "moderate", true)).toBe(40);
  });

  it("scales fluids by weight and weather, plus 15 % at altitude", () => {
    expect(fluidsPerHour(70, "cool")).toBe(350);
    expect(fluidsPerHour(70, "moderate")).toBe(490);
    expect(fluidsPerHour(70, "hot")).toBe(630);
    expect(fluidsPerHour(70, "extreme")).toBe(770);
    expect(fluidsPerHour(70, "hot", true)).toBe(725);
  });

  it("uses a measured sweat rate instead of the weight estimate when given", () => {
    expect(fluidsPerHour(70, "hot", false, 900)).toBe(900);
    expect(fluidsPerHour(70, "hot", true, 900)).toBe(1035);
  });

  it("sets sodium by weather, plus 10 % at altitude", () => {
    expect(sodiumPerHour("cool")).toBe(300);
    expect(sodiumPerHour("moderate")).toBe(500);
    expect(sodiumPerHour("hot")).toBe(700);
    expect(sodiumPerHour("extreme")).toBe(900);
    expect(sodiumPerHour("hot", true)).toBe(770);
  });
});

describe("the runner's own numbers", () => {
  it("scales sodium by how salty a sweater they are", () => {
    expect(sodiumPerHour("hot", false, "low")).toBe(560);
    expect(sodiumPerHour("hot", false, "high")).toBe(840);
    expect(sodiumPerHour("hot", true, "very_high")).toBe(1078);
  });

  it("keeps a sensitive stomach under 60 g/h, or 75 with dual carbs; an iron one follows the tables", () => {
    expect(carbsPerHour(90, "high", false, "sensitive")).toBe(60);
    expect(carbsPerHour(90, "high", true, "sensitive")).toBe(75);
    expect(carbsPerHour(90, "high", false, "iron")).toBe(90);
    expect(carbsPerHour(50, "low", false, "sensitive")).toBe(25);
  });

  it("flags a first ultra on a demanding plan", () => {
    const inputs = {
      weightKg: 70,
      durationH: 14,
      effort: "low" as const,
      weather: "cool" as const,
      experience: "beginner" as const,
    };
    expect(riskFlags(inputs, calculatePlan(inputs)).map((r) => r.code)).toEqual([
      "long-duration",
      "first-ultras",
    ]);
    expect(
      riskFlags({ ...inputs, durationH: 6 }, calculatePlan({ ...inputs, durationH: 6 })),
    ).toEqual([]);
  });
});

describe("the whole plan", () => {
  const plan = calculatePlan({
    weightKg: 70,
    durationH: 10,
    effort: "moderate",
    weather: "moderate",
    caffeine: true,
    electrolytes: true,
  });

  it("multiplies the hourly needs by the hours", () => {
    expect(plan).toMatchObject({
      durationH: 10,
      carbsPerHour: 56,
      fluidsPerHour: 490,
      sodiumPerHour: 500,
      totalCarbs: 560,
      totalFluids: 4900,
      totalSodium: 5000,
    });
  });

  it("adds caffeine (4 mg/kg, capped) and the extra electrolytes when asked", () => {
    expect(plan.advanced).toEqual({
      caffeinePerHour: 28,
      totalCaffeine: 280,
      magnesiumPerHour: 75,
      totalMagnesium: 750,
      potassiumPerHour: 75,
      totalPotassium: 750,
      calciumPerHour: 50,
      totalCalcium: 500,
    });
    const heavy = calculatePlan({
      weightKg: 120,
      durationH: 2,
      effort: "low",
      weather: "cool",
      caffeine: true,
    });
    expect(heavy.advanced).toEqual({ caffeinePerHour: 100, totalCaffeine: 400 });
  });

  it("leaves the extras empty otherwise", () => {
    const plain = calculatePlan({ weightKg: 70, durationH: 5, effort: "low", weather: "cool" });
    expect(plain.advanced).toEqual({});
  });

  it("works in pounds through the unit helpers", () => {
    expect(Math.round(lbToKg(154.3))).toBe(70);
    expect(Math.round(kgToLb(70))).toBe(154);
  });
});

describe("before and after the race", () => {
  it("carb loading is 10 g/kg a day; recovery is 1.2 g/kg carbs, 0.3 g/kg protein, 25 ml/kg", () => {
    expect(carbLoadingPerDay(70)).toBe(700);
    expect(recovery(70)).toEqual({ carbsG: 84, proteinG: 21, fluidsMl: 1750 });
  });

  it("splits dual carbs 60/40 and spaces caffeine at hour 1 then every fourth hour", () => {
    expect(dualCarbSplit(90)).toEqual({ glucoseG: 54, fructoseG: 36 });
    expect(caffeineProtocol(70, 10)).toEqual({ doseMg: 35, hours: [1, 4, 8], totalMg: 105 });
  });

  it("estimates the spend by strategy", () => {
    const plan = calculatePlan({
      weightKg: 70,
      durationH: 10,
      effort: "moderate",
      weather: "moderate",
    });
    // Premium: 3 gels × 10 h × $2.5 + 1 bottle × 10 h × $3. Budget: 2 chews × 10 × $2 + half the drink.
    expect(costEstimate(plan)).toEqual({
      premium: 105,
      budget: 55,
      realFood: 24,
      perHour: { high: 11, low: 6 },
      aidStations: 3,
    });
  });
});

describe("hour by hour", () => {
  it("lists each hour, at most 24, and eases off at night on a night race", () => {
    const plan = calculatePlan({
      weightKg: 70,
      durationH: 30,
      effort: "moderate",
      weather: "moderate",
    });
    const rows = hourlyTimeline(plan, true);
    expect(rows).toHaveLength(24);
    expect(rows[0]).toEqual({ hour: 1, carbsG: 39, fluidsMl: 392, sodiumMg: 500, night: true });
    expect(rows[11]).toEqual({ hour: 12, carbsG: 56, fluidsMl: 490, sodiumMg: 500, night: false });
    expect(rows[21].night).toBe(true);
    expect(hourlyTimeline(plan, false).every((r) => !r.night)).toBe(true);
  });
});

describe("fuel ideas", () => {
  const needs = { carbsPerHour: 56, fluidsPerHour: 490, sodiumPerHour: 500 };

  it("turns an hour's carbs into gels, chews and drink mix", () => {
    expect(fuelOptions(needs)).toEqual([
      { kind: "gels", perHour: 3, carbsG: 56 },
      { kind: "chews", perHour: 2, carbsG: 56 },
      { kind: "drink", perHour: 2, carbsG: 56, fluidsMl: 490 },
    ]);
  });

  it("or into bananas, dates and bars", () => {
    expect(fuelOptions(needs, true).map((o) => [o.kind, o.perHour])).toEqual([
      ["bananas", 3],
      ["dates", 4],
      ["bars", 2],
    ]);
  });

  it("offers a mixed strategy", () => {
    expect(mixedStrategy(needs)).toEqual({
      gelsPerHour: 2,
      sideKind: "chews",
      drinkMl: 245,
      waterMl: 245,
    });
    expect(mixedStrategy(needs, true).sideKind).toBe("bananas");
  });
});

describe("aid stations", () => {
  const needs = { carbsPerHour: 56, fluidsPerHour: 490, sodiumPerHour: 500 };
  const stations: AidStation[] = [
    { id: "b", name: "Ridge", distance: 50, unit: "km", dropBag: true },
    { id: "a", name: "Creek", distance: 25, unit: "km", crewAccess: true },
    { id: "c", name: "Finish", distance: 100, unit: "km" },
    { id: "d", name: "Lake", distance: 75, unit: "km" },
  ];

  it("sorts the stations and shares the race's hours out by distance", () => {
    const segments = stationSegments(needs, 20, stations);
    expect(segments.map((s) => s.to)).toEqual(["Creek", "Ridge", "Lake", "Finish"]);
    expect(segments[0]).toMatchObject({
      from: "start",
      distanceKm: 25,
      hours: 5,
      carbsG: 280,
      fluidsMl: 2450,
      sodiumMg: 2500,
      crewAccess: true,
      dropBag: false,
    });
  });

  it("assumes 10 km/h when there is no finish time, and converts miles", () => {
    const miles = stationSegments(needs, 0, [{ id: "x", name: "Mid", distance: 10, unit: "mi" }]);
    expect(miles[0].distanceKm).toBeCloseTo(16.09, 2);
    expect(miles[0].hours).toBeCloseTo(1.609, 3);
  });

  it("packs a drop bag only for stations with a bag or crew, with fuel for the segment just run", () => {
    const bags = dropBags(stationSegments(needs, 20, stations));
    expect(bags.map((b) => b.station)).toEqual(["Creek", "Ridge"]);
    expect(bags[0].items).toEqual([
      { kind: "gels", count: 12, carbsG: 280 },
      { kind: "bottles", count: 5, fluidsMl: 2450 },
      { kind: "saltCaps", count: 12, sodiumMg: 2500 },
      { kind: "socks" },
      { kind: "blisterKit" },
      { kind: "antiChafe" },
      { kind: "headlamp" },
    ]);
    // Second station: no spare kit (odd index), still a headlamp for a 5-hour leg.
    expect(bags[1].items.some((i) => i.kind === "socks")).toBe(false);
    expect(bags[1].items.some((i) => i.kind === "headlamp")).toBe(true);
    expect(stationSegments(needs, 20, [])).toEqual([]);
  });
});

describe("weather", () => {
  it("heat index matches NOAA's table within a degree, and is the temperature when it is cool", () => {
    // 30 °C (86 °F) at 70 % humidity: NOAA lists 95 °F, which is 35 °C.
    expect(heatIndexC(30, 70)).toBeGreaterThan(34);
    expect(heatIndexC(30, 70)).toBeLessThan(36.2);
    expect(heatIndexC(20, 50)).toBe(20);
  });

  it("estimates WBGT and the dew point", () => {
    expect(wbgtC(30, 70)).toBeCloseTo(32.6, 1);
    expect(dewPointC(30, 70)).toBeCloseTo(24, 0);
  });

  it("bands the heat index and scales fluids and sodium", () => {
    expect(heatStressLevel(25)).toBe("low");
    expect(heatStressLevel(28)).toBe("moderate");
    expect(heatStressLevel(35)).toBe("high");
    expect(heatStressLevel(40)).toBe("extreme");
    expect(weatherAdjustments(35, 50, 600, 500)).toEqual({
      fluidMultiplier: 1.3,
      sodiumMultiplier: 1.4,
      adjustedFluids: 780,
      adjustedSodium: 700,
      fluidIncreasePct: 30,
      sodiumIncreasePct: 40,
    });
    const humid = weatherAdjustments(28, 90, 600, 500);
    expect(humid.fluidMultiplier).toBeCloseTo(1.265, 3);
    expect(humid.adjustedSodium).toBe(690);
    expect(weatherAdjustments(20, 50, 600, 500).adjustedFluids).toBe(600);
  });
});

describe("risk flags", () => {
  it("raises the flags the plan calls for, in display order", () => {
    const inputs = {
      weightKg: 95,
      durationH: 14,
      effort: "extreme" as const,
      weather: "extreme" as const,
      altitude: true,
      caffeine: true,
    };
    const results = calculatePlan(inputs);
    expect(riskFlags(inputs, results).map((r) => r.code)).toEqual([
      "high-carbs",
      "heat-manual",
      "altitude",
      "long-duration",
      "caffeine",
    ]);
  });

  it("prefers the forecast over the manual weather, and flags hyponatremia", () => {
    const inputs = {
      weightKg: 120,
      durationH: 8,
      effort: "low" as const,
      weather: "cool" as const,
    };
    const results = { ...calculatePlan(inputs), fluidsPerHour: 900, totalFluids: 7200 };
    const risks = riskFlags(inputs, results, { heatIndexC: 40, humidity: 85 });
    expect(risks.map((r) => r.code)).toEqual(["heat-forecast", "hyponatremia"]);
    expect(risks[0]).toMatchObject({
      severity: "extreme",
      data: { heatIndexF: 104, humid: true, fluidsPerHour: 1170, sodiumPerHour: 420 },
    });
  });

  it("stays quiet for an easy plan", () => {
    const inputs = { weightKg: 60, durationH: 6, effort: "low" as const, weather: "cool" as const };
    expect(riskFlags(inputs, calculatePlan(inputs))).toEqual([]);
  });
});

describe("after the race", () => {
  it("compares what was taken with what was planned", () => {
    const planned = { carbsPerHour: 56, fluidsPerHour: 490, sodiumPerHour: 500 };
    expect(variance(planned, { carbsPerHour: 70, fluidsPerHour: null })).toEqual({
      carbs: { delta: 14, percent: 25 },
    });
    expect(variance(planned, { sodiumPerHour: 400 }).sodium).toEqual({ delta: -100, percent: -20 });
  });
});
