// Headless balance runner: replays the canned builds in tests/fixtures/builds.ts and prints how each
// level went. Bundled with esbuild and run on node:
//   npx esbuild tools/balance.ts --bundle --platform=node --format=esm --outfile=/tmp/b.mjs && node /tmp/b.mjs [level]
import { ENEMIES } from '../web/src/data/enemies';
import { LEVELS } from '../web/src/data/levels';
import { TOWERS } from '../web/src/data/towers';
import { runBuild } from '../tests/fixtures/builds';

const only = Number(process.argv[2] ?? 0);
for (const level of LEVELS) {
  if (only && level.n !== only) continue;
  const r = runBuild(level, TOWERS, ENEMIES);
  const idle = runBuild(level, TOWERS, ENEMIES, []);
  const towers = r.sim.towers.map((t) => `${t.def.key}${t.tier + 1}${t.tier ? (t.path ? "B" : "A") : ""}@${t.c},${t.r}`).join(" ");
  console.log(
    `L${level.n} ${r.sim.phase.padEnd(4)} wave ${r.sim.wave}/${level.waves.length} lives ${r.sim.lives} leaks ${r.sim.leaks} cash ${r.sim.cash} score ${r.sim.score} skipped ${r.skipped} | idle ${idle.sim.phase} w${idle.sim.wave}`,
  );
  if (process.env.VERBOSE) {
    console.log('   ', towers);
    for (const l of r.log) console.log('   ', l);
  }
}
