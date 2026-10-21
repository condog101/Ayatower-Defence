/** Small seeded PRNG (mulberry32) so each level's coastline is the same every time. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(i: number, seed: number): number {
  let h = (i * 374761393 + seed * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth 1D value noise in [-1, 1], sampled at `x` with feature size `period`. */
export function noise1d(x: number, seed: number, period: number): number {
  const t = x / period;
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  const a = hash(i, seed);
  const b = hash(i + 1, seed);
  return (a + (b - a) * u) * 2 - 1;
}

/** Two octaves of noise1d. */
export function fbm(x: number, seed: number, period: number): number {
  return noise1d(x, seed, period) * 0.7 + noise1d(x, seed + 101, period / 3) * 0.3;
}

export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
export const randInt = (lo: number, hi: number) => Math.floor(rand(lo, hi + 1));
export const chance = (p: number) => Math.random() < p;
