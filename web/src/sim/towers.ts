import { fireAt, launchBoat, layMine } from './projectiles';
import type { Sim } from './sim';
import { eligible, pickTargets } from './targeting';
import type { Tower } from './types';

/** How often a jammer re-applies its slow, ticks. */
const PULSE = 10;

/**
 * Support auras: each attack tower takes the max (never the sum) of each multiplier from every
 * support tower whose range covers it. Called on place / upgrade / sell.
 */
export function refreshBuffs(sim: Sim) {
  const supports = sim.towers.filter((t) => t.def.tiers[t.tier].buff);
  for (const t of sim.towers) {
    const b = { range: 1, rate: 1, dmg: 1, bounty: 1 };
    if (t.def.role === 'attack') {
      for (const s of supports) {
        const tier = s.def.tiers[s.tier];
        if ((s.x - t.x) ** 2 + (s.y - t.y) ** 2 > tier.range ** 2) continue;
        const sb = tier.buff!;
        b.range = Math.max(b.range, sb.range ?? 1);
        b.rate = Math.max(b.rate, sb.rate ?? 1);
        b.dmg = Math.max(b.dmg, sb.dmg ?? 1);
        b.bounty = Math.max(b.bounty, sb.bounty ?? 1);
      }
    }
    t.buff = b;
    const tier = t.def.tiers[t.tier];
    t.laneSpots = tier.projectile === 'mine' ? sim.spotsWithin(t.x, t.y, tier.range * b.range) : [];
    const near = sim.nearestLanePoint(t.x, t.y);
    t.entry = { lane: near.lane, d: near.d };
  }
}

function supportStep(sim: Sim, t: Tower) {
  const tier = t.def.tiers[t.tier];
  if (tier.income && sim.phase === 'wave' && ++t.incomeAcc >= tier.income.everyTicks) {
    t.incomeAcc = 0;
    sim.cash += tier.income.amount;
    sim.emit({ t: 'income', tower: t.id, amount: tier.income.amount });
  }
  if (!tier.slow && !tier.stun) return;
  const r2 = tier.range ** 2;
  const inRange = (layer: 'sea' | 'air') => (layer === 'sea' ? tier.hitsSea : tier.hitsAir);
  if (tier.slow && ++t.pulseAcc >= PULSE) {
    t.pulseAcc = 0;
    for (const e of sim.enemies) {
      if (!e.alive || !inRange(e.def.layer) || (e.x - t.x) ** 2 + (e.y - t.y) ** 2 > r2) continue;
      e.slowMult = e.slowTicks > 0 ? Math.min(e.slowMult, tier.slow.mult) : tier.slow.mult;
      e.slowTicks = Math.max(e.slowTicks, tier.slow.ticks);
    }
  }
  if (tier.stun) {
    if (t.stunAcc < tier.stun.every) t.stunAcc++;
    if (t.stunAcc < tier.stun.every) return;
    let hit = false;
    for (const e of sim.enemies) {
      if (!e.alive || !inRange(e.def.layer) || (e.x - t.x) ** 2 + (e.y - t.y) ** 2 > r2) continue;
      e.stunTicks = Math.max(e.stunTicks, e.def.boss ? Math.round(tier.stun.ticks / 3) : tier.stun.ticks);
      hit = true;
    }
    // Holds its charge until something sails into range.
    if (hit) {
      t.stunAcc = 0;
      sim.emit({ t: 'jam', tower: t.id, freeze: true });
    }
  }
}

export function stepTowers(sim: Sim) {
  for (const t of sim.towers) {
    if (t.def.role === 'support') {
      supportStep(sim, t);
      continue;
    }
    const tier = t.def.tiers[t.tier];
    if (t.cooldown > 0) t.cooldown--;
    // Turrets track their current target between shots.
    const cur = t.targetId ? sim.enemyById(t.targetId) : undefined;
    if (cur && eligible(t, cur)) t.angle = Math.atan2(cur.y - t.y, cur.x - t.x);
    else t.targetId = 0;
    if (t.cooldown > 0) continue;
    const reload = Math.max(1, Math.round(tier.cooldown / t.buff.rate));

    if (tier.projectile === 'mine') {
      if (sim.phase !== 'wave' || t.alive >= (tier.maxAlive ?? 1)) continue;
      layMine(sim, t, tier);
      t.cooldown = reload;
      continue;
    }
    if (tier.projectile === 'boat') {
      const room = (tier.maxAlive ?? 1) - t.alive;
      if (room <= 0) continue;
      const target = pickTargets(t, sim.enemies, 1)[0];
      if (!target) continue;
      t.targetId = target.id;
      const n = Math.min(room, tier.multishot ?? 1);
      for (let k = 0; k < n; k++) launchBoat(sim, t, tier, k);
      t.cooldown = reload;
      continue;
    }
    const n = tier.multishot ?? 1;
    const targets = pickTargets(t, sim.enemies, n);
    if (targets.length === 0) continue;
    t.targetId = targets[0].id;
    t.angle = Math.atan2(targets[0].y - t.y, targets[0].x - t.x);
    // Multishot towers spread over distinct targets, then double up on the best ones.
    for (let k = 0; k < n; k++) fireAt(sim, t, tier, targets[k % targets.length]);
    t.cooldown = reload;
  }
}
