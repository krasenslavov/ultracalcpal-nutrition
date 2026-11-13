// UltraCalcPal Fuel Calculator: pop-up logic. The maths is packages/nutrition/src (bundled in by
// scripts/build-extension.mjs), the same code as ultracalcpal.com. No network calls, no analytics;
// the only thing stored is the weight unit.
import {
  calculatePlan,
  carbLoadingPerDay,
  fuelOptions,
  lbToKg,
  recovery,
} from "../../packages/nutrition/src/index.ts";

const WEIGHT_KG = { min: 30, max: 200 };
const HOURS = { min: 1, max: 48 };

const $ = (id) => document.getElementById(id);
const num = (id) => {
  const v = $(id).value.trim();
  return v === "" ? null : Number(v);
};
let unit = "kg";

const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
const show = (out, ...nodes) => out.replaceChildren(...nodes);
const err = (out, text) => show(out, el("p", text, "err"));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const FUEL = {
  gels: (o) => `${plural(o.perHour, "gel", "gels")} an hour (about 25 g each)`,
  chews: (o) => `${plural(o.perHour, "serving", "servings")} of chews an hour (about 30 g each)`,
  drink: (o) =>
    `${plural(o.perHour, "scoop", "scoops")} of drink mix an hour in ${o.fluidsMl} ml of water`,
  bananas: (o) => `${plural(o.perHour, "banana", "bananas")} an hour (about 27 g each)`,
  dates: (o) => `${plural(o.perHour, "date", "dates")} an hour (about 18 g each)`,
  bars: (o) => `${plural(o.perHour, "bar", "bars")} an hour (about 40 g each)`,
};

// Units (the one thing we remember).
const setUnit = (value) => {
  unit = value === "lb" ? "lb" : "kg";
  for (const r of document.querySelectorAll('input[name="unit"]')) r.checked = r.value === unit;
  $("weight").placeholder = unit === "kg" ? "70" : "155";
};
for (const r of document.querySelectorAll('input[name="unit"]'))
  r.addEventListener("change", () => {
    setUnit(r.value);
    try {
      chrome.storage?.local.set({ unit });
    } catch {
      /* storage is optional */
    }
  });
try {
  chrome.storage?.local.get("unit", (v) => v && v.unit && setUnit(v.unit));
} catch {
  /* storage is optional */
}

const tile = (value, label) => {
  const li = el("li");
  li.append(el("span", value, "big"), el("span", label, "lbl"));
  return li;
};

$("go").addEventListener("click", () => {
  const out = $("out");
  const weight = num("weight");
  const hours = num("hours");
  if (weight === null || hours === null) return err(out, "Enter your weight and your hours.");
  const weightKg = unit === "lb" ? lbToKg(weight) : weight;
  if (!(weightKg >= WEIGHT_KG.min && weightKg <= WEIGHT_KG.max))
    return err(out, `Weight must be between ${WEIGHT_KG.min} and ${WEIGHT_KG.max} kg.`);
  if (!(hours >= HOURS.min && hours <= HOURS.max))
    return err(out, `Hours must be between ${HOURS.min} and ${HOURS.max}.`);

  const inputs = {
    weightKg,
    durationH: hours,
    effort: $("effort").value,
    weather: $("weather").value,
    dualCarb: $("dualCarb").checked,
    altitude: $("altitude").checked,
    caffeine: $("caffeine").checked,
    realFood: $("realFood").checked,
  };
  const plan = calculatePlan(inputs);
  const tiles = el("ul", undefined, "tiles");
  tiles.append(
    tile(`${plan.carbsPerHour} g`, "carbs / h"),
    tile(`${plan.fluidsPerHour} ml`, "fluids / h"),
    tile(`${plan.sodiumPerHour} mg`, "sodium / h"),
  );
  const totals = el(
    "p",
    `Over ${hours} hours: ${plan.totalCarbs} g of carbs, ${(plan.totalFluids / 1000).toFixed(1)} litres of fluid and ${plan.totalSodium} mg of sodium.`,
  );
  const fuel = el("ul", undefined, "fuel");
  for (const option of fuelOptions(plan, inputs.realFood))
    fuel.append(el("li", FUEL[option.kind](option)));
  const nodes = [tiles, totals, el("h2", "What that looks like"), fuel];
  if (plan.advanced.caffeinePerHour !== undefined) {
    nodes.push(
      el(
        "p",
        `Caffeine: about ${plan.advanced.caffeinePerHour} mg an hour, ${plan.advanced.totalCaffeine} mg in total.`,
      ),
    );
  }
  const after = recovery(weightKg);
  nodes.push(
    el("h2", "Before and after"),
    el(
      "p",
      `The three days before: about ${carbLoadingPerDay(weightKg)} g of carbs a day. The first hour after: about ${after.carbsG} g of carbs, ${after.proteinG} g of protein and ${after.fluidsMl} ml of fluids.`,
    ),
    el(
      "p",
      "A starting point from published sports-nutrition ranges, scaled to you. Test it in training. Not medical advice.",
      "hint",
    ),
  );
  show(out, ...nodes);
});
