// Simple deterministic RNG utilities (mulberry32 + helpers)

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RNG = () => number; // [0,1)

export function createSeededRng(seed: string | number | undefined): RNG {
  const seedStr = String(seed ?? "metroidvania");
  const seedFn = xmur3(seedStr);
  const a = seedFn();
  return mulberry32(a);
}

export function rngInt(
  rng: RNG,
  minInclusive: number,
  maxInclusive: number
): number {
  const r = rng();
  return Math.floor(r * (maxInclusive - minInclusive + 1)) + minInclusive;
}

export function rngChoice<T>(rng: RNG, arr: T[]): T {
  return arr[rngInt(rng, 0, arr.length - 1)];
}

export function rngShuffle<T>(rng: RNG, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rngInt(rng, 0, i);
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}
