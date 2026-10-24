// Wave tuner: replays each level's canned build, shrinks any wave that costs too many lives (or the
// wave that loses the level) down to the floors in tests/fixtures/wave-rules.ts, then spaces out its
// heaviest group or raises the purse when it can shrink no further, and grows the back two thirds
// when a level is too easy. Never touches a wave other than the one that hurt.
// Prints {level: {cash, waves: [[{n, gap} per group] per wave]}} as JSON for tools/maps/apply_counts.py.
//   npx esbuild tools/tune.ts --bundle --platform=node --format=esm --outfile=/tmp/t.mjs && node /tmp/t.mjs 8 9 10
import { ENEMIES } from '../web/src/data/enemies';
import { LEVELS } from '../web/src/data/levels';
import { TOWERS } from '../web/src/data/towers';
import { runBuild } from '../tests/fixtures/builds';
import { floorN, livesAtStake, waveThreat } from '../tests/fixtures/wave-rules';
import type { LevelDef } from '../web/src/sim/types';

/** Lives the canned build should lose (mirrors LOSS_TARGET in tests/levels.test.ts, aiming inside it). */
const TARGET: Record<number, [number, number]> = {
  1: [7, 13], 2: [10, 18], 3: [15, 26], 4: [15, 26], 5: [20, 40], 6: [20, 40], 7: [20, 40], 8: [20, 40], 9: [20, 40], 10: [25, 55],
  11: [25, 55], 12: [25, 55], 13: [25, 55], 14: [25, 55], 15: [30, 60], 16: [30, 60], 17: [30, 60], 18: [30, 60], 19: [30, 60], 20: [30, 60],
};
const PER_WAVE_CAP = 15;
/** A group's gap may widen to this many times its hand-written value. */
const GAP_STRETCH = 2.5;
const round2 = (x: number) => Math.round(x * 100) / 100;
const total = (l: LevelDef) => l.waves.reduce((a, w) => a + waveThreat(w), 0);

/** One forward pass lifting every non-boss group to its floor (lead floors depend on earlier waves). */
function repairFloors(level: LevelDef) {
  level.waves.forEach((w, i) =>
    w.groups.forEach((g, gi) => {
      if (!ENEMIES[g.kind].boss) g.n = Math.max(g.n, floorN(level, i, gi));
    }),
  );
}

const want = process.argv.slice(2).map(Number);
const out: Record<number, { cash: number; waves: { n: number; gap: number }[][] }> = {};
for (const level of LEVELS) {
  if (want.length && !want.includes(level.n)) continue;
  const [minLoss, maxLoss] = TARGET[level.n];
  const gap0 = level.waves.map((w) => w.groups.map((g) => g.gap));
  const touched = new Set<number>();
  let last = '';
  let grows = 0;
  let cashBumps = 0;
  const bumpCash = () => {
    if (cashBumps >= 6) return false;
    cashBumps++;
    level.startCash = Math.round((level.startCash * 1.1) / 10) * 10;
    return true;
  };
  repairFloors(level);
  for (let it = 0; it < 300; it++) {
    let r;
    try {
      r = runBuild(level, TOWERS, ENEMIES);
    } catch (e) {
      last = String(e);
      break;
    }
    const lost: number[] = [];
    for (const l of r.log) {
      const m = /wave (\d+) done: lives \d+ \(-(\d+)\)/.exec(l);
      if (m) lost[Number(m[1]) - 1] = Number(m[2]);
    }
    const lostAll = 100 - r.sim.lives;
    last = `${r.sim.phase} lives ${r.sim.lives} skipped ${r.skipped}`;
    // Shrink the wave that cost the most lives (the one that ended a lost run counts all it took).
    if (r.sim.phase === 'lost') lost[lost.length] = 100 - lost.reduce((a, b) => a + (b ?? 0), 0);
    let target = -1;
    const worst = lost.reduce((b, v, i) => ((v ?? 0) > (lost[b] ?? 0) ? i : b), 0);
    if (r.sim.phase === 'lost' || (lost[worst] ?? 0) > Math.max(PER_WAVE_CAP, maxLoss * 0.6) || lostAll > maxLoss) target = worst;
    // A level that falls in its first third is short of money, not over-stuffed with ships.
    if (r.sim.phase === 'lost' && r.sim.wave <= level.waves.length / 3 && bumpCash()) continue;
    if (target >= 0) {
      const w = level.waves[target];
      const groups = w.groups.map((g, gi) => ({ g, gi })).filter(({ g }) => !ENEMIES[g.kind].boss);
      const shrinkable = groups.filter(({ g, gi }) => g.n > floorN(level, target, gi));
      if (shrinkable.length) {
        for (const { g, gi } of shrinkable) g.n = Math.max(floorN(level, target, gi), Math.floor(g.n * 0.8));
        touched.add(target);
        continue;
      }
      // At its floors: space out the group with the most PATIENCE riding on it, then try more money.
      const wide = groups
        .filter(({ g, gi }) => g.gap < GAP_STRETCH * gap0[target][gi])
        .sort((a, b) => b.g.n * livesAtStake(b.g.kind) - a.g.n * livesAtStake(a.g.kind))[0];
      if (wide) {
        wide.g.gap = Math.min(GAP_STRETCH * gap0[target][wide.gi], round2(wide.g.gap * 1.25));
        touched.add(target);
        continue;
      }
      if (bumpCash()) continue;
      console.error(`L${level.n}: wave ${target + 1} is at its floors, gaps and purse maxed; stopping`);
      break;
    }
    if (lostAll < minLoss && grows++ < 10) {
      const from = Math.floor(level.waves.length / 3);
      level.waves.forEach((w, i) => {
        if (i < from || w.boss || touched.has(i)) return;
        for (const g of w.groups) g.n = Math.min(250, Math.max(g.n + 1, Math.round(g.n * 1.1)));
      });
      repairFloors(level);
      continue;
    }
    break;
  }
  out[level.n] = { cash: level.startCash, waves: level.waves.map((w) => w.groups.map((g) => ({ n: g.n, gap: g.gap }))) };
  console.error(`L${level.n}: ${last}`);
  const prev = LEVELS[level.n - 2];
  if (prev && total(level) < total(prev)) {
    console.error(`L${level.n}: threat ${Math.round(total(level))} is below L${prev.n}'s ${Math.round(total(prev))}`);
  }
}
console.log(JSON.stringify(out));
