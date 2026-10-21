import { sec } from './const';
import type { EnemyDef, EnemyKey, LevelDef, WaveDef } from './types';

export interface Spawn {
  at: number;
  kind: EnemyKey;
}

/** A wave's spawns as tick offsets from its start, in spawn order. */
export function schedule(w: WaveDef): Spawn[] {
  const out: Spawn[] = [];
  for (const g of w.groups) {
    for (let i = 0; i < g.n; i++) out.push({ at: sec(g.delay + i * g.gap), kind: g.kind });
  }
  // Stable: equal ticks keep group order.
  return out.map((s, i) => ({ s, i })).sort((a, b) => a.s.at - b.s.at || a.i - b.i).map((x) => x.s);
}

/** Feeds one wave's spawns into the sim. Several can run at once when a wave is sent early. */
export class WaveRunner {
  readonly spawns: Spawn[];
  private i = 0;
  private elapsed = -1;

  constructor(readonly wave: number, def: WaveDef) {
    this.spawns = schedule(def);
  }

  get spawnedAll(): boolean {
    return this.i >= this.spawns.length;
  }

  /** Advance one tick; returns the kinds due now. */
  step(): EnemyKey[] {
    this.elapsed++;
    const due: EnemyKey[] = [];
    while (this.i < this.spawns.length && this.spawns[this.i].at <= this.elapsed) due.push(this.spawns[this.i++].kind);
    return due;
  }
}

type Defs = Record<EnemyKey, EnemyDef>;

function walk(kind: EnemyKey, defs: Defs, f: (d: EnemyDef) => number): number {
  const d = defs[kind];
  let total = f(d);
  for (const c of d.children ?? []) total += c.n * walk(c.kind, defs, f);
  if (d.spawns) total += d.spawns.max * walk(d.spawns.kind, defs, f);
  return total;
}

/** Every enemy a level can produce, children and boss launches (at their cap) included. */
export function levelEnemyCount(level: LevelDef, defs: Defs): number {
  let n = 0;
  for (const w of level.waves) for (const g of w.groups) n += g.n * walk(g.kind, defs, () => 1);
  return n;
}

/** Highest score obtainable from play on a level: every kill plus every wave reward (no clear bonus). */
export function levelMaxPlayScore(level: LevelDef, defs: Defs): number {
  let s = 0;
  for (const w of level.waves) {
    s += w.reward;
    for (const g of w.groups) s += g.n * walk(g.kind, defs, (d) => d.score);
  }
  return s;
}

/** Ticks from a wave's start to its last spawn. */
export function waveSpan(w: WaveDef): number {
  const s = schedule(w);
  return s.length ? s[s.length - 1].at : 0;
}

/**
 * Shortest wall-clock time a level can take: every wave must finish spawning before the next can
 * be sent, at 3x speed, minus 10% slack.
 */
export function levelMinMs(level: LevelDef): number {
  const ticks = level.waves.reduce((a, w) => a + waveSpan(w), 0);
  return Math.floor(((ticks / 60) * 1000 * 0.9) / 3);
}
