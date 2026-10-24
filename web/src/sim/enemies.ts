import { BASE_SPEED, DT } from './const';
import type { Sim } from './sim';
import type { DmgKind, Enemy, EnemyKey, Tower } from './types';
import { tierOf } from './tiers';

/** Lateral spread of ships across the lane, px either side of the centre line. */
const LATERAL = 10;

export function spawnEnemy(sim: Sim, kind: EnemyKey, d: number, wave: number, lateral?: number, gen = 0, lane = 0): Enemy {
  const def = sim.enemyDefs[kind];
  const e: Enemy = {
    id: sim.nextId++,
    def,
    hp: def.hp,
    maxHp: def.hp,
    lane,
    d: Math.max(0, d),
    left: 0,
    lateral: lateral ?? (def.big ? 0 : (sim.rng() * 2 - 1) * LATERAL),
    x: 0,
    y: 0,
    angle: 0,
    alive: true,
    revealed: !def.stealth,
    wave,
    gen,
    spawnAcc: 0,
    spawned: 0,
    slowMult: 1,
    slowTicks: 0,
    stunTicks: 0,
    markTicks: 0,
    paintTicks: 0,
    paintMult: 1,
  };
  place(sim, e);
  sim.enemies.push(e);
  sim.emit({ t: 'spawn', id: e.id });
  return e;
}

function place(sim: Sim, e: Enemy) {
  const lane = sim.lanes[e.lane];
  const [x, y] = lane.posAt(e.d);
  const [nx, ny] = lane.normalAt(e.d);
  e.x = x + nx * e.lateral;
  e.y = y + ny * e.lateral;
  e.angle = lane.angleAt(e.d);
  e.left = lane.length - e.d;
}

export function stepEnemies(sim: Sim) {
  // Index loop: boss launches push onto the array mid-iteration and start moving next tick.
  const n = sim.enemies.length;
  for (let i = 0; i < n; i++) {
    const e = sim.enemies[i];
    if (!e.alive) continue;
    if (e.markTicks > 0) e.markTicks--;
    if (e.paintTicks > 0 && --e.paintTicks === 0) e.paintMult = 1;
    if (e.slowTicks > 0 && --e.slowTicks === 0) e.slowMult = 1;
    const sp = e.def.spawns;
    if (sp && e.spawned < sp.max && ++e.spawnAcc >= sp.everyTicks) {
      e.spawnAcc = 0;
      e.spawned++;
      const child = spawnEnemy(sim, sp.kind, e.d + 4, e.wave, undefined, e.gen + 1, e.lane);
      sim.emit({ t: 'bossSpawn', id: child.id });
    }
    if (e.stunTicks > 0) {
      e.stunTicks--;
      continue;
    }
    e.d += e.def.speed * BASE_SPEED * DT * (e.slowTicks > 0 ? e.slowMult : 1);
    if (e.d >= sim.lanes[e.lane].length) {
      leak(sim, e);
      continue;
    }
    place(sim, e);
  }
}

function leak(sim: Sim, e: Enemy) {
  e.alive = false;
  sim.leaks++;
  sim.lives = Math.max(0, sim.lives - e.def.leak);
  sim.emit({ t: 'leak', id: e.id, key: e.def.key, lives: sim.lives });
  if (!sim.lowLivesSaid && sim.lives > 0 && sim.lives <= sim.level.lives * 0.25) {
    sim.lowLivesSaid = true;
    sim.emit({ t: 'lowLives' });
  }
}

/**
 * Deal damage. Armour shrugs off bullets; FATWA marks take +50%; support buffs and sub hunters
 * multiply. Returns true if this killed it.
 */
export function damage(sim: Sim, e: Enemy, amount: number, kind: DmgKind, tower?: Tower, subMult = 1): boolean {
  if (!e.alive) return false;
  if (e.def.armoured && kind === 'bullet') {
    sim.emit({ t: 'hit', id: e.id, x: e.x, y: e.y, dmg: 0, immune: true });
    return false;
  }
  let amt = amount * (e.markTicks > 0 ? 1.5 : 1) * (tower ? tower.buff.dmg : 1);
  if (e.def.sub) amt *= subMult;
  if (e.paintTicks > 0) amt *= e.paintMult;
  e.hp -= amt;
  sim.emit({ t: 'hit', id: e.id, x: e.x, y: e.y, dmg: amt });
  if (e.hp <= 0) {
    kill(sim, e, tower);
    return true;
  }
  return false;
}

function kill(sim: Sim, e: Enemy, tower?: Tower) {
  e.alive = false;
  // Bounty halves with each generation, so a destroyer's whole brood doesn't pay out like a fleet.
  const cash = Math.floor((e.def.cash * (tower ? tower.buff.bounty : 1)) / 2 ** e.gen);
  sim.cash += cash;
  sim.score += e.def.score;
  sim.killScore += e.def.score;
  sim.kills++;
  if (tower) tower.kills++;
  sim.emit({ t: 'die', id: e.id, key: e.def.key, x: e.x, y: e.y, cash, big: !!e.def.big || !!e.def.boss, layer: e.def.layer });
  let k = 0;
  for (const c of e.def.children ?? []) {
    for (let i = 0; i < c.n; i++, k++) {
      const child = spawnEnemy(sim, c.kind, e.d - k * 6, e.wave, e.def.big ? undefined : e.lateral, e.gen + 1, e.lane);
      // Children keep the parent's slow but not its stun.
      if (e.slowTicks > 0) {
        child.slowMult = e.slowMult;
        child.slowTicks = e.slowTicks;
      }
    }
  }
}

/** Stealth enemies are only targetable inside a radar's reveal radius, a Ghadir's sub detection, or while marked. */
export function revealPass(sim: Sim) {
  const eyes = sim.towers.filter((t) => {
    const tier = tierOf(t);
    return tier.reveal || tier.detectsSub;
  });
  for (const e of sim.enemies) {
    if (!e.alive || !e.def.stealth) continue;
    let seen = e.markTicks > 0;
    for (let i = 0; !seen && i < eyes.length; i++) {
      const t = eyes[i];
      const tier = tierOf(t);
      const d2 = (e.x - t.x) ** 2 + (e.y - t.y) ** 2;
      if (tier.reveal && d2 <= tier.reveal ** 2) seen = true;
      else if (tier.detectsSub && e.def.sub && d2 <= tier.detectsSub ** 2) seen = true;
    }
    e.revealed = seen;
  }
}
