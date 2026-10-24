// Canned builds: one plausible, unoptimised tower plan per level. The balance harness
// (tests/levels.test.ts, tools/balance.ts) replays them headless; every level must be won.

import { isPlaceable } from '../../web/src/sim/grid';
import { Sim } from '../../web/src/sim/sim';
import { tierOf } from '../../web/src/sim/tiers';
import type { EnemyDef, EnemyKey, LevelDef, PathIndex, Targeting, Tower, TowerDef, TowerKey } from '../../web/src/sim/types';

/**
 * place: build `place` at `at`, or (no `at`) on the free spot whose range covers the most lane.
 * upgrade: a cell, or a tower kind (its lowest-tier tower, first built on ties), along `path`
 * (default A; only the first upgrade of a tower picks, later ones follow the path it took).
 */
export type Action =
  | { wave: number; place: TowerKey; at?: [number, number]; mode?: Targeting }
  | { wave: number; upgrade: [number, number] | TowerKey; path?: PathIndex };

const P = (wave: number, place: TowerKey, c?: number, r?: number, mode?: Targeting): Action =>
  ({ wave, place, at: c === undefined || r === undefined ? undefined : [c, r], mode });
const U = (wave: number, c: number | TowerKey, r?: number): Action => ({ wave, upgrade: typeof c === 'string' ? c : [c, r!] });
/** Upgrade along path B. */
const UB = (wave: number, kind: TowerKey): Action => ({ wave, upgrade: kind, path: 1 });

/** From `wave` on, one more tower of each kind per wave, each taken straight to tier 3. */
const tail = (wave: number, kinds: TowerKey[]): Action[] =>
  kinds.flatMap((k, i) => [P(wave + i, k), U(wave + i, k), U(wave + i, k)]);

/** The same, taking each one down path B. */
const tailB = (wave: number, kinds: TowerKey[]): Action[] =>
  kinds.flatMap((k, i) => [P(wave + i, k), UB(wave + i, k), UB(wave + i, k)]);

/**
 * The free spot for `key`: first the lane that towers of its kind cover least (aircraft-only
 * towers prefer the air corridor; ships never use it), then the most samples of that lane in
 * range, then the most lane overall. Deterministic: ties go to the first cell in reading order.
 */
export function bestSpot(sim: Sim, key: TowerKey): [number, number] | null {
  const def = sim.towerDefs[key];
  const t0 = def.base;
  const range = t0.range;
  const air = sim.level.airLane;
  const airOnly = t0.hitsAir && !t0.hitsSea;
  let lanes = sim.lanes.map((_, i) => i);
  if (air !== undefined && sim.lanes.length > 1) lanes = airOnly ? [air] : lanes.filter((i) => i !== air);
  const covers = (x: number, y: number, r: number, lane: number) => sim.lanes[lane].spotsWithin(x, y, r).length;
  // Attack towers balance against towers that hit the same layer; support towers (radar, jammer,
  // minaret) against their own kind, so a second radar goes to the lane the first one can't see.
  const same = (t: Tower) =>
    def.role === 'support' ? t.def.key === key : t.def.role === 'attack' && (t.def.base.hitsAir === t0.hitsAir || t.def.base.hitsSea === t0.hitsSea);
  const cover = (lane: number) => sim.towers.filter(same).reduce((n, t) => n + covers(t.x, t.y, tierOf(t).range, lane), 0);
  const target = lanes.reduce((best, l) => (cover(l) < cover(best) ? l : best), lanes[0]);
  let best: [number, number] | null = null;
  let bestScore = 0;
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 25; c++) {
      if (!isPlaceable(sim.grid, c, r, def.placement) || sim.towerAt(c, r)) continue;
      const x = c * 32 + 16;
      const y = r * 32 + 16;
      const score = covers(x, y, range, target) * 10_000 + sim.spotsWithin(x, y, range).length;
      if (score > bestScore) {
        bestScore = score;
        best = [c, r];
      }
    }
  }
  return best;
}

/**
 * Act II: every tower is open, so each level shares one opener and then a long tail of fully upgraded
 * towers; `b` lists the kinds that level takes down path B (the rest go down A). Three-lane maps
 * (`lanes` 3) open with a pier per lane, three-lane or sky-road maps (`radars` 3) add a third radar
 * (at `radarAt` when given: bestSpot keeps ship-hitting towers off a sky road, but a radar must watch
 * it), and `late` towers from LATE extend the tail (a negative `late` trims it instead).
 */
const act2 = (
  b: TowerKey[],
  tailKinds: TowerKey[],
  { lanes = 2, radars = 2, late = 0, from = 4, radarAt }: { lanes?: number; radars?: number; late?: number; from?: number; radarAt?: [number, number] } = {},
): Action[] => {
  const up = (wave: number, k: TowerKey) => (b.includes(k) ? UB(wave, k) : U(wave, k));
  return [
    ...(lanes === 3 ? [P(1, 'boats'), up(2, 'boats')] : []),
    ...(radars === 3 ? [P(2, 'radar', radarAt?.[0], radarAt?.[1])] : []),
    P(1, 'boats'), P(1, 'boats'), P(1, 'radar'), P(1, 'aa_gun'), P(1, 'mines'), P(1, 'martyr'), up(2, 'boats'), up(2, 'boats'),
    P(3, 'missile'), P(3, 'sam'), up(3, 'aa_gun'), P(4, 'radar'), up(4, 'missile'), up(4, 'mines'), P(5, 'minaret'), up(5, 'sam'),
    up(5, 'martyr'), P(6, 'jammer'), P(6, 'ghadir'), up(6, 'radar'), up(7, 'missile'), up(7, 'sam'), up(8, 'jammer'), up(8, 'ghadir'),
    up(9, 'minaret'), P(9, 'shahed'), up(10, 'shahed'), up(10, 'radar'), up(11, 'shahed'), up(11, 'jammer'), up(12, 'minaret'),
    ...[...tailKinds.slice(0, tailKinds.length + Math.min(0, late)), ...LATE.slice(0, Math.max(0, late))].flatMap((k, i) => [P(from + i, k), up(from + i, k), up(from + i, k)]),
  ];
};

/** Act II tails run on with these (land towers: shallows run out first) so late-game cash keeps turning into towers. */
const LATE: TowerKey[] = ['missile', 'sam', 'shahed', 'missile', 'boats', 'missile', 'sam', 'shahed', 'missile', 'aa_gun', 'missile'];

export const BUILDS: Record<number, Action[]> = {
  1: [P(1, 'boats'), P(2, 'mines'), P(5, 'boats'), U(9, 'boats')],
  2: [P(1, 'boats'), P(2, 'mines'), P(7, 'martyr'), P(9, 'boats')],
  3: [P(1, 'boats'), P(1, 'aa_gun'), P(3, 'mines'), P(5, 'boats'), U(7, 'aa_gun'), P(10, 'martyr')],
  4: [
    P(1, 'boats'), P(1, 'mines'), P(2, 'aa_gun'), U(3, 'boats'), P(4, 'jammer'), P(5, 'shahed'), U(6, 'mines'),
    U(7, 'aa_gun'), P(8, 'boats'), U(11, 'boats'),
  ],
  5: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(2, 'aa_gun'), U(3, 'boats'), P(4, 'martyr'), P(5, 'missile'),
    U(6, 'mines'), U(7, 'aa_gun'), P(8, 'jammer'), U(9, 'missile'), P(10, 'shahed'), U(11, 'boats'),
    U(12, 'martyr'), P(13, 'missile'), U(14, 'shahed'), U(15, 'aa_gun'), U(16, 'mines'), U(17, 'missile'),
    P(12, 'missile'), U(12, 'missile'),
  ],
  6: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(2, 'radar'), P(3, 'aa_gun'), P(5, 'radar'), U(3, 'boats'), U(4, 'boats'),
    P(4, 'ghadir'), P(5, 'martyr'), U(6, 'boats'), P(6, 'missile'), U(7, 'mines'), U(8, 'aa_gun'),
    U(9, 'boats'), P(10, 'shahed'), U(11, 'missile'), U(12, 'ghadir'), P(13, 'jammer'), U(14, 'martyr'),
    U(15, 'radar'), U(16, 'shahed'), U(17, 'missile'),
    P(12, 'missile'), U(12, 'missile'),
  ],
  7: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(2, 'aa_gun'), P(3, 'martyr'), U(3, 'boats'), P(4, 'radar'),
    U(4, 'boats'), P(5, 'sam'), U(6, 'boats'), P(6, 'missile'), U(7, 'mines'), U(8, 'sam'), U(9, 'martyr'),
    P(10, 'shahed'), U(11, 'missile'), P(12, 'sam'), U(13, 'boats'), P(14, 'jammer'), U(15, 'radar'),
    U(16, 'sam'), U(17, 'missile'), P(18, 'missile'), U(19, 'shahed'),
    ...tail(12, ['missile', 'shahed', 'boats', 'martyr']),
  ],
  8: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(1, 'martyr'), P(2, 'aa_gun'), P(3, 'aa_gun'), U(3, 'boats'), U(3, 'boats'),
    P(4, 'missile'), P(5, 'radar'), P(5, 'sam'), P(6, 'radar'), U(6, 'boats'), U(7, 'sam'), P(8, 'minaret'), U(9, 'missile'),
    P(10, 'sam'), U(11, 'mines'), P(12, 'shahed'), U(13, 'martyr'), U(14, 'sam'), P(15, 'jammer'),
    U(16, 'boats'), U(17, 'shahed'), U(18, 'missile'), U(19, 'sam'), P(20, 'missile'), U(21, 'radar'),
    U(22, 'minaret'),
    ...tail(12, ['missile']), P(14, 'shahed'),
  ],
  9: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(1, 'martyr'), P(2, 'aa_gun'), P(3, 'aa_gun'), U(3, 'boats'), U(3, 'boats'),
    P(4, 'missile'), P(5, 'radar'), P(5, 'sam'), P(6, 'radar'), U(6, 'boats'), U(7, 'sam'), P(8, 'minaret'), U(9, 'missile'),
    P(10, 'sam'), U(11, 'mines'), P(12, 'shahed'), U(13, 'martyr'), U(14, 'sam'), P(15, 'jammer'),
    U(16, 'boats'), U(17, 'shahed'), U(18, 'missile'), U(19, 'sam'), P(20, 'missile'), U(21, 'radar'),
    U(22, 'minaret'), U(23, 'martyr'), U(24, 'shahed'),
    ...tail(10, ['missile', 'shahed', 'sam', 'boats', 'missile', 'martyr']),
  ],
  10: [
    P(1, 'boats'), P(1, 'boats'), P(1, 'mines'), P(1, 'martyr'), P(2, 'aa_gun'), U(3, 'boats'), U(3, 'boats'),
    P(4, 'missile'), P(5, 'radar'), P(5, 'sam'), P(6, 'radar'), U(6, 'boats'), U(7, 'sam'), P(8, 'minaret'), U(9, 'missile'),
    P(10, 'sam'), U(11, 'mines'), P(12, 'shahed'), U(13, 'martyr'), U(14, 'sam'), P(15, 'jammer'),
    U(16, 'boats'), U(17, 'shahed'), U(18, 'missile'), U(19, 'sam'), P(20, 'missile'), U(21, 'radar'),
    U(22, 'minaret'), U(23, 'martyr'), U(24, 'shahed'), P(25, 'missile'), U(26, 'missile'), U(26, 'missile'),
    P(27, 'shahed'),
    ...tail(8, ['missile', 'shahed', 'sam', 'boats', 'missile', 'martyr', 'missile', 'shahed', 'missile', 'sam']),
  ],
  11: act2(['missile', 'radar'], ['missile', 'shahed', 'boats', 'missile', 'martyr', 'sam', 'missile', 'mines', 'shahed', 'missile', 'boats', 'missile'], { late: -5 }),
  12: act2(['mines', 'martyr'], ['mines', 'martyr', 'missile', 'boats', 'shahed', 'mines', 'missile', 'sam', 'martyr', 'missile', 'boats', 'missile', 'mines'], { late: 3 }),
  13: act2(['aa_gun', 'boats'], ['sam', 'missile', 'aa_gun', 'boats', 'missile', 'radar', 'shahed', 'sam', 'missile', 'aa_gun', 'missile', 'boats', 'missile'], { lanes: 3, radars: 3, late: -5 }),
  14: act2(['aa_gun', 'sam'], ['sam', 'aa_gun', 'missile', 'sam', 'boats', 'missile', 'aa_gun', 'sam', 'shahed', 'missile', 'sam', 'missile', 'aa_gun'], { radars: 3, radarAt: [14, 5], late: 6 }),
  15: act2(['sam', 'boats'], ['sam', 'sam', 'missile', 'aa_gun', 'sam', 'boats', 'missile', 'sam', 'aa_gun', 'missile', 'sam', 'shahed', 'missile', 'sam'], { radars: 3, radarAt: [19, 6], late: 3 }),
  16: act2(['ghadir', 'mines'], ['ghadir', 'mines', 'missile', 'ghadir', 'shahed', 'missile', 'mines', 'sam', 'ghadir', 'missile', 'boats', 'missile', 'mines', 'missile'], { late: -5 }),
  17: act2(['martyr', 'ghadir'], ['martyr', 'mines', 'missile', 'ghadir', 'martyr', 'sam', 'missile', 'mines', 'martyr', 'missile', 'shahed', 'missile', 'ghadir', 'missile', 'mines'], { lanes: 3, late: 3 }),
  18: act2(['missile', 'jammer'], ['missile', 'shahed', 'sam', 'missile', 'boats', 'martyr', 'missile', 'mines', 'sam', 'missile', 'shahed', 'missile', 'aa_gun', 'missile', 'boats'], { late: -5 }),
  19: act2(['jammer', 'shahed'], ['shahed', 'missile', 'jammer', 'shahed', 'sam', 'missile', 'boats', 'shahed', 'missile', 'mines', 'sam', 'missile', 'shahed', 'missile', 'martyr', 'missile'], { late: -5 }),
  20: act2(['minaret', 'missile'], ['missile', 'missile', 'sam', 'shahed', 'missile', 'boats', 'mines', 'missile', 'sam', 'shahed', 'missile', 'martyr', 'missile', 'aa_gun', 'missile', 'sam', 'missile'], { late: -2 }),
};

export interface BuildResult {
  sim: Sim;
  /** Actions never executed (couldn't afford or invalid). */
  skipped: number;
  log: string[];
}

/** Replay a level's canned build (or `actions`) with AUTO on until the level is won or lost. */
export function runBuild(
  level: LevelDef,
  towers: Record<TowerKey, TowerDef>,
  enemies: Record<EnemyKey, EnemyDef>,
  actions: Action[] = BUILDS[level.n] ?? [],
  maxTicks = 60 * 60 * 40,
): BuildResult {
  const sim = new Sim(level, towers, enemies);
  const pending = [...actions];
  const placed: Tower[] = [];
  const log: string[] = [];
  // In list order: actions not yet due are passed over (later due ones may still go); the first
  // due action that can't be afforded stops the round, so the list is also a spending priority.
  const act = () => {
    for (let i = 0; i < pending.length; ) {
      const a = pending[i];
      if (a.wave > sim.wave + 1) {
        i++;
        continue;
      }
      if ('place' in a) {
        if (sim.cash < sim.towerDefs[a.place].base.cost) return;
        const at = a.at ?? bestSpot(sim, a.place);
        if (!at) throw new Error(`L${level.n}: nowhere to put ${a.place}`);
        const why = sim.canPlace(a.place, at[0], at[1]);
        if (!why.ok) throw new Error(`L${level.n}: can't place ${a.place} at ${at}: ${why.reason}`);
        const t = sim.place(a.place, at[0], at[1])!;
        placed.push(t);
        if (a.mode) sim.setTargeting(t, a.mode);
      } else {
        const kind = a.upgrade;
        const path = a.path ?? 0;
        const t =
          typeof kind === 'string'
            ? placed.filter((x) => x.def.key === kind && x.tier < 2 && (x.tier === 0 || x.path === path)).sort((x, y) => x.tier - y.tier)[0]
            : sim.towerAt(kind[0], kind[1]);
        if (!t) throw new Error(`L${level.n}: no tower to upgrade at ${a.upgrade}`);
        if (!sim.upgrade(t, path)) return;
      }
      pending.splice(i, 1);
    }
  };
  let lastLives = sim.lives;
  let wave = 0;
  while (!sim.over && sim.tick < maxTicks) {
    if (sim.tick % 30 === 0) act();
    if (sim.phase === 'build') sim.startWave();
    for (const ev of sim.step()) {
      if (ev.t === 'waveStart') wave = ev.wave;
      if (ev.t === 'waveEnd') {
        log.push(`wave ${ev.wave} done: lives ${sim.lives} (-${lastLives - sim.lives}) cash ${sim.cash}`);
        lastLives = sim.lives;
      }
    }
  }
  void wave;
  return { sim, skipped: pending.length, log };
}
