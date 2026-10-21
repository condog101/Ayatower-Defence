// Wave-count tuner: replays each level's canned build, shrinks any wave that costs too many lives
// (or the wave that loses the level), and grows the back two thirds when a level is too easy.
// Prints {level: [[n per group] per wave]} as JSON for tools/maps/apply_counts.py.
//   npx esbuild tools/tune.ts --bundle --platform=node --format=esm --outfile=/tmp/t.mjs && node /tmp/t.mjs 8 9 10
import { ENEMIES } from '../web/src/data/enemies';
import { LEVELS } from '../web/src/data/levels';
import { TOWERS } from '../web/src/data/towers';
import { runBuild } from '../tests/fixtures/builds';

const PER_WAVE_CAP = 12;
const want = process.argv.slice(2).map(Number);
const out: Record<number, number[][]> = {};
for (const level of LEVELS) {
  if (want.length && !want.includes(level.n)) continue;
  const minLoss = level.n <= 2 ? 2 : 10;
  const maxLoss = level.n <= 2 ? 20 : 45;
  let last = '';
  for (let it = 0; it < 80; it++) {
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
    let target = -1;
    if (r.sim.phase === 'lost') target = lost.length; // the wave that broke us
    else {
      const worst = lost.reduce((b, v, i) => (v > (lost[b] ?? 0) ? i : b), 0);
      if ((lost[worst] ?? 0) > PER_WAVE_CAP || total > maxLoss) target = worst;
    }
    if (target >= 0) {
      const w = level.waves[target];
      if (w.boss) {
        // never shrink the boss itself; shrink its escorts, else the wave before it
        const esc = w.groups.filter((g) => !ENEMIES[g.kind].boss && g.n > 1);
        if (esc.length) for (const g of esc) g.n = Math.max(1, Math.floor(g.n * 0.8));
        else for (const g of level.waves[target - 1].groups) g.n = Math.max(1, Math.floor(g.n * 0.85));
      } else for (const g of w.groups) g.n = Math.max(1, Math.floor(g.n * 0.85));
      continue;
    }
    if (total < minLoss) {
      const from = Math.floor(level.waves.length / 3);
      level.waves.forEach((w, i) => {
        if (i < from || w.boss) return;
        for (const g of w.groups) g.n = Math.max(g.n + 1, Math.round(g.n * 1.1));
      });
      continue;
    }
    break;
  }
  out[level.n] = level.waves.map((w) => w.groups.map((g) => g.n));
  console.error(`L${level.n}: ${last}`);
}
console.log(JSON.stringify(out));
