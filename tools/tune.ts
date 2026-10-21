// Wave-count tuner: replays each level's canned build, shrinks any wave that costs too many lives
// (or the wave that loses the level), and grows the back two thirds when a level is too easy.
// Prints {level: [[n per group] per wave]} as JSON for tools/maps/apply_counts.py.
//   npx esbuild tools/tune.ts --bundle --platform=node --format=esm --outfile=/tmp/t.mjs && node /tmp/t.mjs 8 9 10
import { ENEMIES } from '../web/src/data/enemies';
import { LEVELS } from '../web/src/data/levels';
import { TOWERS } from '../web/src/data/towers';
import { runBuild } from '../tests/fixtures/builds';

/** Lives the canned build should lose (mirrors LOSS_TARGET in tests/levels.test.ts, aiming inside it). */
const TARGET: Record<number, [number, number]> = {
  1: [7, 13], 2: [10, 18], 3: [15, 26], 4: [15, 26], 5: [20, 40], 6: [20, 40], 7: [20, 40], 8: [20, 40], 9: [20, 40], 10: [25, 55],
};
const PER_WAVE_CAP = 15;
const want = process.argv.slice(2).map(Number);
const out: Record<number, { cash: number; waves: number[][] }> = {};
for (const level of LEVELS) {
  if (want.length && !want.includes(level.n)) continue;
  const [minLoss, maxLoss] = TARGET[level.n];
  let last = '';
  let grows = 0;
  let cashBumps = 0;
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
    const total = 100 - r.sim.lives;
    last = `${r.sim.phase} lives ${r.sim.lives} skipped ${r.skipped}`;
    // Shrink the wave that cost the most lives (the one that ended a lost run counts all it took).
    if (r.sim.phase === 'lost') lost[lost.length] = 100 - lost.reduce((a, b) => a + (b ?? 0), 0);
    let target = -1;
    const worst = lost.reduce((b, v, i) => ((v ?? 0) > (lost[b] ?? 0) ? i : b), 0);
    if (r.sim.phase === 'lost' || (lost[worst] ?? 0) > Math.max(PER_WAVE_CAP, maxLoss * 0.6) || total > maxLoss) target = worst;
    // A level that falls in its first third is short of money, not over-stuffed with ships.
    if (r.sim.phase === 'lost' && r.sim.wave <= level.waves.length / 3 && cashBumps++ < 6) {
      level.startCash = Math.round((level.startCash * 1.1) / 10) * 10;
      continue;
    }
    if (target >= 0) {
      let w = level.waves[target];
      // never shrink the boss itself; shrink its escorts, else the wave before it
      if (w.boss && !w.groups.some((g) => !ENEMIES[g.kind].boss && g.n > 1)) w = level.waves[target - 1];
      const shrinkable = w.groups.filter((g) => !ENEMIES[g.kind].boss && g.n > 1);
      if (shrinkable.length) for (const g of shrinkable) g.n = Math.max(1, Math.floor(g.n * 0.8));
      else if (target > 0) for (const g of level.waves[target - 1].groups) if (!ENEMIES[g.kind].boss) g.n = Math.max(1, Math.floor(g.n * 0.8));
      continue;
    }
    if (total < minLoss && grows++ < 10) {
      const from = Math.floor(level.waves.length / 3);
      level.waves.forEach((w, i) => {
        if (i < from || w.boss) return;
        for (const g of w.groups) g.n = Math.min(250, Math.max(g.n + 1, Math.round(g.n * 1.1)));
      });
      continue;
    }
    break;
  }
  out[level.n] = { cash: level.startCash, waves: level.waves.map((w) => w.groups.map((g) => g.n)) } as never;
  console.error(`L${level.n}: ${last}`);
}
console.log(JSON.stringify(out));
