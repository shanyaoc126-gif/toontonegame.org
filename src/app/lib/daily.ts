// Daily Challenge: deterministic 5-color set seeded from the UTC date.
// Same UTC date in -> same five colors out, on every device, no server.

import { RGB } from './color-utils';

// mulberry32 — small, fast, deterministic 32-bit PRNG
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// UTC date key, e.g. "2026-07-28"
export function utcDateKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Numeric seed from the UTC date key (YYYYMMDD)
export function seedFromDateKey(key: string): number {
  return Number(key.replace(/-/g, '')) >>> 0;
}

// The five target colors for a given UTC date key.
export function dailyColors(key: string = utcDateKey()): RGB[] {
  const rand = mulberry32(seedFromDateKey(key));
  const colors: RGB[] = [];
  for (let i = 0; i < 5; i++) {
    colors.push({
      r: Math.floor(rand() * 256),
      g: Math.floor(rand() * 256),
      b: Math.floor(rand() * 256),
    });
  }
  return colors;
}

// Milliseconds until the next 00:00 UTC reset
export function msUntilUtcMidnight(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
