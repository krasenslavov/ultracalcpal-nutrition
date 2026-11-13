# ultracalcpal-nutrition

Ultra-marathon fuelling maths with no dependencies, in TypeScript. The same code runs the free
calculator on [ultracalcpal.com](https://www.ultracalcpal.com) and the
[UltraCalcPal Fuel Calculator](https://github.com/krasenslavov/ultracalcpal-nutrition) browser
extension.

- No dependencies, tree-shakeable, ESM and CommonJS, types included.
- Pure functions. Nothing is sent anywhere and nothing is stored.
- Kilograms, kilometres, Celsius, grams, millilitres and milligrams inside; convert at the edge
  with the unit helpers.
- Results that need words (fuel kinds, risk flags, drop-bag items) are codes and numbers, so you
  can put them in any language.

```sh
npm install ultracalcpal-nutrition
```

## Examples

```ts
import { calculatePlan, fuelOptions, carbLoadingPerDay, recovery } from "ultracalcpal-nutrition";

// A 70 kg runner, 14 hours out, steady effort, hot day
const plan = calculatePlan({ weightKg: 70, durationH: 14, effort: "moderate", weather: "hot" });
// { carbsPerHour: 56, fluidsPerHour: 630, sodiumPerHour: 700,
//   totalCarbs: 784, totalFluids: 8820, totalSodium: 9800, ... }

// What an hour's carbs look like as products
fuelOptions(plan);
// [{ kind: "gels", perHour: 3, carbsG: 56 }, { kind: "chews", perHour: 2, carbsG: 56 },
//  { kind: "drink", perHour: 2, carbsG: 56, fluidsMl: 630 }]

carbLoadingPerDay(70); // 700 g a day for the three days before
recovery(70); // { carbsG: 84, proteinG: 21, fluidsMl: 1750 } in the first hour after
```

The course, as segments between aid stations and what to put in each drop bag:

```ts
import { stationSegments, dropBags } from "ultracalcpal-nutrition";

const segments = stationSegments(plan, 14, [
  { id: "a", name: "Creek", distance: 25, unit: "km", crewAccess: true },
  { id: "b", name: "Finish", distance: 100, unit: "km" },
]);
dropBags(segments); // what to pack at Creek
```

Heat, and what stands out for this plan:

```ts
import { heatIndexC, wbgtC, weatherAdjustments, riskFlags } from "ultracalcpal-nutrition";

heatIndexC(32, 60); // feels-like temperature, Celsius
wbgtC(32, 60); // wet-bulb globe temperature estimate
weatherAdjustments({ tempC: 32, humidity: 60 }); // fluid and sodium multipliers for the forecast
riskFlags({ weightKg: 70, durationH: 14, effort: "moderate", weather: "hot" }, plan);
// [{ code: "heat-manual", severity: "moderate", data: { ... } }, ...]
```

## What is in it

| Area             | Functions                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per hour         | `calculatePlan`, `carbsPerHour`, `fluidsPerHour`, `sodiumPerHour`, `advancedMetrics`, `hourlyTimeline`, `dualCarbSplit`                               |
| Fuel             | `fuelOptions`, `mixedStrategy`, `SERVINGS`, `costEstimate`                                                                                            |
| Before and after | `carbLoadingPerDay`, `recovery`, `caffeineProtocol`                                                                                                   |
| Aid stations     | `sortStations`, `stationSegments`, `dropBags`                                                                                                         |
| Weather          | `heatIndexC`, `wbgtC`, `dewPointC`, `heatStressLevel`, `weatherAdjustments`, `HEAT_MULTIPLIERS`                                                       |
| Risks and review | `riskFlags`, `variance`                                                                                                                               |
| Units            | `kgToLb`, `lbToKg`, `kmToMi`, `miToKm`, `cToF`, `fToC`, `round1`                                                                                      |
| Constants        | `CARBS_G_PER_KG_H`, `FLUIDS_ML_PER_KG_H`, `SODIUM_MG_PER_H`, `CARB_CAP`, `GUT_CARB_CAP`, `SODIUM_SENSITIVITY`, `ALTITUDE`, `CAFFEINE`, `ELECTROLYTES` |

The numbers are published sports-nutrition ranges scaled by body weight and conditions: a starting
point to test in training, not medical advice. Talk to a doctor or a sports dietitian about your
own health.

## Links

- The calculator in the browser, with saved plans, aid stations, a forecast and a shareable plan
  for your crew: https://www.ultracalcpal.com
- The browser extension (Chrome, Edge, Firefox) and this package's source: https://github.com/krasenslavov/ultracalcpal-nutrition

MIT licence.
