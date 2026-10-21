import { BASE_SPEED, DT, sec } from './const';
import { damage } from './enemies';
import type { Sim } from './sim';
import { canHit } from './targeting';
import type { Enemy, Projectile, TierDef, Tower } from './types';

/** Homing turn rate, rad per tick. */
const TURN = 7 * DT;
/** A homing round whose target died looks for another within this radius. */
const RETARGET = 80;
/** Mines trigger on ships within this lane distance. */
const MINE_TRIGGER = 10;
/** Martyr boats detonate on ships within this distance (plus half the ship's radius). */
const BOAT_CONTACT = 12;

/** The sprite a tower tier fires, for the view. */
export function projectileSprite(t: Tower): string {
  switch (t.def.key) {
    case 'boats':
      return t.tier === 0 ? 'p_bullet' : 'p_rocket';
    case 'mines':
      return 'p_mine';
    case 'martyr':
      return 'p_boat';
    case 'shahed':
      return 'p_shahed';
    case 'missile':
      return 'p_missile';
    case 'ghadir':
      return 'p_torpedo';
    case 'sam':
      return 'p_sam';
    default:
      return 'p_bullet';
  }
}

/** Where `e` will be after `ticks`, assuming it keeps its current speed. */
export function predict(sim: Sim, e: Enemy, ticks: number): [number, number] {
  if (e.stunTicks > 0) return [e.x, e.y];
  const v = e.def.speed * BASE_SPEED * DT * (e.slowTicks > 0 ? e.slowMult : 1);
  const d = Math.min(sim.lane.length, e.d + v * ticks);
  const [x, y] = sim.lane.posAt(d);
  const [nx, ny] = sim.lane.normalAt(d);
  return [x + nx * e.lateral, y + ny * e.lateral];
}

function base(sim: Sim, t: Tower, tier: TierDef): Projectile {
  return {
    id: sim.nextId++,
    kind: tier.projectile,
    towerId: t.id,
    sprite: projectileSprite(t),
    x: t.x,
    y: t.y,
    vx: 0,
    vy: 0,
    angle: t.angle,
    speed: tier.speed ?? 200,
    targetId: 0,
    damage: tier.damage,
    dmgKind: tier.dmgKind,
    splash: tier.splash ?? 0,
    pierce: tier.pierce ?? 1,
    hitIds: [],
    ttl: sec(4),
    hitsSea: tier.hitsSea,
    hitsAir: tier.hitsAir,
    d: 0,
    tx: 0,
    ty: 0,
    stage: 0,
    ignoreHp: tier.ignoreHp ?? 0,
    subMult: tier.subMult ?? 1,
    alive: true,
  };
}

/** Fire at one target (aimed rounds) — hitscan resolves immediately. */
export function fireAt(sim: Sim, t: Tower, tier: TierDef, e: Enemy) {
  const range = tier.range * t.buff.range;
  if (tier.projectile === 'hitscan') {
    sim.emit({ t: 'shoot', tower: t.id, x: t.x, y: t.y, tx: e.x, ty: e.y, kind: 'hitscan', sprite: projectileSprite(t) });
    damage(sim, e, tier.damage, tier.dmgKind, t, tier.subMult);
    return;
  }
  const p = base(sim, t, tier);
  const dist = Math.hypot(e.x - t.x, e.y - t.y);
  if (tier.projectile === 'splash') {
    // Lobbed: lands on the predicted spot after its flight time, with a little scatter.
    const flight = Math.max(20, Math.round((dist / p.speed) * 60));
    const [px, py] = predict(sim, e, flight);
    p.tx = px + (sim.rng() * 2 - 1) * 6;
    p.ty = py + (sim.rng() * 2 - 1) * 6;
    p.ttl = flight;
    p.vx = (p.tx - p.x) / flight;
    p.vy = (p.ty - p.y) / flight;
  } else {
    // shot / homing: lead the target once.
    const [px, py] = predict(sim, e, Math.round((dist / p.speed) * 60));
    const a = Math.atan2(py - t.y, px - t.x);
    p.vx = Math.cos(a) * p.speed * DT;
    p.vy = Math.sin(a) * p.speed * DT;
    p.ttl = Math.ceil(((range * 1.5) / p.speed) * 60);
    p.targetId = e.id;
  }
  p.angle = Math.atan2(p.vy, p.vx);
  sim.projectiles.push(p);
  sim.emit({ t: 'shoot', tower: t.id, x: t.x, y: t.y, tx: e.x, ty: e.y, kind: p.kind, sprite: p.sprite });
}

/** Mine layer: drop a mine on a random lane spot in range. */
export function layMine(sim: Sim, t: Tower, tier: TierDef) {
  if (t.laneSpots.length === 0) return;
  const p = base(sim, t, tier);
  p.d = t.laneSpots[Math.floor(sim.rng() * t.laneSpots.length)];
  const [x, y] = sim.lane.posAt(p.d);
  const [nx, ny] = sim.lane.normalAt(p.d);
  const lat = (sim.rng() * 2 - 1) * 8;
  p.x = x + nx * lat;
  p.y = y + ny * lat;
  p.ttl = Infinity;
  t.alive++;
  sim.projectiles.push(p);
  sim.emit({ t: 'shoot', tower: t.id, x: t.x, y: t.y, tx: p.x, ty: p.y, kind: 'mine', sprite: p.sprite });
}

/** Martyr dock: launch a boat at the nearest point of the lane; it then drives up the lane into traffic. */
export function launchBoat(sim: Sim, t: Tower, tier: TierDef, k: number) {
  const p = base(sim, t, tier);
  p.d = Math.max(0, Math.min(sim.lane.length, t.entryD + k * 24));
  const [ex, ey] = sim.lane.posAt(p.d);
  p.tx = ex;
  p.ty = ey;
  p.angle = Math.atan2(ey - t.y, ex - t.x);
  p.ttl = sec(25);
  t.alive++;
  sim.projectiles.push(p);
  sim.emit({ t: 'shoot', tower: t.id, x: t.x, y: t.y, tx: ex, ty: ey, kind: 'boat', sprite: p.sprite });
}

function layerOk(p: Projectile, e: Enemy): boolean {
  return e.def.layer === 'sea' ? p.hitsSea : p.hitsAir;
}

/** Area damage on matching layers. Collateral hits stealth too: only aiming needs a reveal. */
export function splashDamage(sim: Sim, x: number, y: number, r: number, p: Projectile, tower?: Tower) {
  sim.emit({ t: 'splash', x, y, r, kind: p.dmgKind, water: p.hitsSea });
  for (const e of sim.enemies) {
    if (!e.alive || !layerOk(p, e)) continue;
    const rr = r + e.def.radius * 0.5;
    if ((e.x - x) ** 2 + (e.y - y) ** 2 <= rr * rr) damage(sim, e, p.damage, p.dmgKind, tower, p.subMult);
  }
}

function finish(sim: Sim, p: Projectile) {
  p.alive = false;
  if (p.kind === 'mine' || p.kind === 'boat') {
    const t = sim.towerById(p.towerId);
    if (t) t.alive = Math.max(0, t.alive - 1);
  }
  sim.emit({ t: 'projDie', id: p.id, x: p.x, y: p.y });
}

/** Direct-hit test for flying rounds: the first eligible, revealed enemy touching the round. */
function directHit(sim: Sim, p: Projectile, tier: TierDef | null): Enemy | null {
  for (const e of sim.enemies) {
    if (!e.alive || !e.revealed || !layerOk(p, e) || p.hitIds.includes(e.id)) continue;
    if (tier && !canHit(tier, e)) continue;
    const rr = e.def.radius + 3;
    if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 <= rr * rr) return e;
  }
  return null;
}

export function stepProjectiles(sim: Sim) {
  const n = sim.projectiles.length;
  for (let i = 0; i < n; i++) {
    const p = sim.projectiles[i];
    if (!p.alive) continue;
    const tower = sim.towerById(p.towerId);
    const tier = tower ? tower.def.tiers[tower.tier] : null;
    if (--p.ttl <= 0 && p.kind !== 'splash') {
      finish(sim, p);
      continue;
    }
    switch (p.kind) {
      case 'mine': {
        for (const e of sim.enemies) {
          if (!e.alive || e.def.layer !== 'sea' || Math.abs(e.d - p.d) >= MINE_TRIGGER) continue;
          if (p.ignoreHp && e.def.hp <= p.ignoreHp) continue;
          if (p.splash) splashDamage(sim, p.x, p.y, p.splash, p, tower);
          else {
            sim.emit({ t: 'splash', x: p.x, y: p.y, r: 12, kind: 'mine', water: true });
            damage(sim, e, p.damage, p.dmgKind, tower);
          }
          finish(sim, p);
          break;
        }
        break;
      }
      case 'boat': {
        const v = p.speed * DT;
        if (p.stage === 0) {
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= v) {
            p.x = p.tx;
            p.y = p.ty;
            p.stage = 1;
          } else {
            p.x += (dx / dist) * v;
            p.y += (dy / dist) * v;
            p.angle = Math.atan2(dy, dx);
          }
        } else {
          p.d -= v;
          if (p.d <= 0) {
            finish(sim, p);
            break;
          }
          const [x, y] = sim.lane.posAt(p.d);
          p.angle = Math.atan2(y - p.y, x - p.x);
          p.x = x;
          p.y = y;
        }
        for (const e of sim.enemies) {
          if (!e.alive || e.def.layer !== 'sea') continue;
          const rr = BOAT_CONTACT + e.def.radius * 0.5;
          if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 <= rr * rr) {
            splashDamage(sim, p.x, p.y, p.splash, p, tower);
            finish(sim, p);
            break;
          }
        }
        break;
      }
      case 'splash': {
        p.x += p.vx;
        p.y += p.vy;
        if (p.ttl <= 0) {
          p.x = p.tx;
          p.y = p.ty;
          splashDamage(sim, p.x, p.y, p.splash, p, tower);
          finish(sim, p);
        }
        break;
      }
      case 'homing':
      case 'shot': {
        if (p.kind === 'homing') {
          let target: Enemy | null = sim.enemyById(p.targetId) ?? null;
          if (!target || !target.alive) {
            target = null;
            let best = RETARGET * RETARGET;
            for (const e of sim.enemies) {
              if (!e.alive || !e.revealed || !layerOk(p, e) || p.hitIds.includes(e.id)) continue;
              if (tier && !canHit(tier, e)) continue;
              const d2 = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
              if (d2 < best) {
                best = d2;
                target = e;
              }
            }
            p.targetId = target ? target.id : 0;
          }
          if (target) {
            const want = Math.atan2(target.y - p.y, target.x - p.x);
            let diff = want - p.angle;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            p.angle += Math.max(-TURN, Math.min(TURN, diff));
          }
          p.vx = Math.cos(p.angle) * p.speed * DT;
          p.vy = Math.sin(p.angle) * p.speed * DT;
        }
        p.x += p.vx;
        p.y += p.vy;
        const e = directHit(sim, p, tier);
        if (!e) break;
        if (p.splash) {
          splashDamage(sim, p.x, p.y, p.splash, p, tower);
          finish(sim, p);
          break;
        }
        p.hitIds.push(e.id);
        damage(sim, e, p.damage, p.dmgKind, tower, p.subMult);
        if (--p.pierce <= 0) finish(sim, p);
        else p.targetId = 0;
        break;
      }
    }
  }
}
