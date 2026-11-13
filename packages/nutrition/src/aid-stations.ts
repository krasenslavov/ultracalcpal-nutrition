import { SERVINGS } from "./fuel";
import type { HourlyNeeds } from "./types";
import { KM_PER_MI } from "./units";

export type DistanceUnit = "km" | "mi";

export type AidStation = {
  id: string;
  name: string;
  /** Distance from the start, in `unit`. */
  distance: number;
  unit: DistanceUnit;
  elevation?: string;
  dropBag?: boolean;
  crewAccess?: boolean;
  cutoffTime?: string;
};

export type Segment = {
  from: string;
  fromDistance: number;
  to: string;
  toDistance: number;
  /** Always kilometres. */
  distanceKm: number;
  /** Estimated time for the segment, in hours, at the race's average pace. */
  hours: number;
  carbsG: number;
  fluidsMl: number;
  sodiumMg: number;
  dropBag: boolean;
  crewAccess: boolean;
};

const toKm = (distance: number, unit: DistanceUnit) =>
  unit === "mi" ? distance * KM_PER_MI : distance;

/** Stations sorted by distance from the start. */
export function sortStations(stations: AidStation[]): AidStation[] {
  return [...stations].sort((a, b) => toKm(a.distance, a.unit) - toKm(b.distance, b.unit));
}

/**
 * What to take in between each pair of stations. The average pace comes from the whole course and
 * the expected finish time; with no finish time, 10 km/h is assumed.
 */
export function stationSegments(
  needs: HourlyNeeds,
  durationH: number,
  stations: AidStation[],
): Segment[] {
  const sorted = sortStations(stations);
  if (sorted.length === 0) return [];
  const last = sorted[sorted.length - 1];
  const totalKm = toKm(last.distance, last.unit);
  const paceKmH = durationH > 0 && totalKm > 0 ? totalKm / durationH : 10;

  const out: Segment[] = [];
  let prev = { name: "start", km: 0, distance: 0 };
  for (const station of sorted) {
    const km = toKm(station.distance, station.unit);
    const distanceKm = km - prev.km;
    const hours = distanceKm / paceKmH;
    out.push({
      from: prev.name,
      fromDistance: prev.distance,
      to: station.name,
      toDistance: station.distance,
      distanceKm,
      hours,
      carbsG: Math.round(needs.carbsPerHour * hours),
      fluidsMl: Math.round(needs.fluidsPerHour * hours),
      sodiumMg: Math.round(needs.sodiumPerHour * hours),
      dropBag: Boolean(station.dropBag),
      crewAccess: Boolean(station.crewAccess),
    });
    prev = { name: station.name, km, distance: station.distance };
  }
  return out;
}

export type DropBagItem =
  | { kind: "gels"; count: number; carbsG: number }
  | { kind: "bottles"; count: number; fluidsMl: number }
  | { kind: "saltCaps"; count: number; sodiumMg: number }
  | { kind: "socks" }
  | { kind: "blisterKit" }
  | { kind: "antiChafe" }
  | { kind: "headlamp" };

export type DropBag = {
  station: string;
  distance: number;
  dropBag: boolean;
  crewAccess: boolean;
  /** Hours from the previous station. */
  hours: number;
  items: DropBagItem[];
};

/** What to pack for each station that has a drop bag or crew: the next segment's fuel plus kit. */
export function dropBags(segments: Segment[]): DropBag[] {
  const out: DropBag[] = [];
  segments.forEach((segment, index) => {
    if (!segment.dropBag && !segment.crewAccess) return;
    const items: DropBagItem[] = [];
    const gels = Math.ceil(segment.carbsG / SERVINGS.gelG);
    if (gels > 0) items.push({ kind: "gels", count: gels, carbsG: segment.carbsG });
    const bottles = Math.ceil(segment.fluidsMl / SERVINGS.bottleMl);
    if (bottles > 0) items.push({ kind: "bottles", count: bottles, fluidsMl: segment.fluidsMl });
    const caps = Math.ceil(segment.sodiumMg / SERVINGS.saltCapMg);
    if (caps > 0) items.push({ kind: "saltCaps", count: caps, sodiumMg: segment.sodiumMg });
    // Spare kit at the first station and every other one after it.
    if (index % 2 === 0)
      items.push({ kind: "socks" }, { kind: "blisterKit" }, { kind: "antiChafe" });
    if (segment.hours > 3) items.push({ kind: "headlamp" });
    out.push({
      station: segment.to,
      distance: segment.toDistance,
      dropBag: segment.dropBag,
      crewAccess: segment.crewAccess,
      hours: segment.hours,
      items,
    });
  });
  return out;
}
