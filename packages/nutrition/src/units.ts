export const LB_PER_KG = 2.20462;
export const KM_PER_MI = 1.60934;

export const lbToKg = (lb: number) => lb / LB_PER_KG;
export const kgToLb = (kg: number) => kg * LB_PER_KG;
export const miToKm = (mi: number) => mi * KM_PER_MI;
export const kmToMi = (km: number) => km / KM_PER_MI;
export const cToF = (c: number) => (c * 9) / 5 + 32;
export const fToC = (f: number) => ((f - 32) * 5) / 9;

/** Rounds to one decimal, the way the old calculator showed temperatures. */
export const round1 = (n: number) => Math.round(n * 10) / 10;
