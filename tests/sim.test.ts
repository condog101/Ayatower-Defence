import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../web/src/data/enemies';
import { TOWERS } from '../web/src/data/towers';
import { rush, wave } from '../web/src/data/maps/recipes';
import { damage, spawnEnemy } from '../web/src/sim/enemies';
import { pickTarget } from '../web/src/sim/targeting';
import { Sim } from '../web/src/sim/sim';
import { tierOf } from '../web/src/sim/tiers';
import type { EnemyKey, SimEvent, WaveDef } from '../web/src/sim/types';
import { mini } from './fixtures/mini-level';

const make = (waves: WaveDef[] = [], seed = 7) => new Sim(mini(waves, { seed }), TOWERS, ENEMIES);

function run(sim: Sim, ticks: number): SimEvent[] {
  const evs: SimEvent[] = [];
  for (let i = 0; i < ticks && !sim.over; i++) evs.push(...sim.step());
  return evs;
}

/** Step until no enemies remain (or `max` ticks). */
function drain(sim: Sim, max = 60 * 120): SimEvent[] {
  const evs: SimEvent[] = [];
  for (let i = 0; i < max && !sim.over; i++) {
    evs.push(...sim.step());
    if (sim.enemies.length === 0 && sim.phase !== 'wave') break;
  }
  return evs;
}

/** Drop one enemy straight onto the lane at distance d. */
const drop = (sim: Sim, kind: EnemyKey, d = 0) => spawnEnemy(sim, kind, d, 0, 0);

describe('waves and lives', () => {
  it('leaks cost PATIENCE and a wave end pays its reward', () => {
    const sim = make([wave(77, rush('patrol', 3, 0.5))]);
    const cash0 = sim.cash;
    expect(sim.startWave()).toBe(true);
    const evs = drain(sim);
    expect(evs.filter((e) => e.t === 'leak')).toHaveLength(3);
    expect(sim.lives).toBe(100 - 3 * ENEMIES.patrol.leak);
    expect(sim.leaks).toBe(3);
    expect(sim.phase).toBe('won');
    expect(sim.cash).toBe(cash0 + 77);
    expect(evs.some((e) => e.t === 'waveEnd' && e.reward === 77)).toBe(true);
  });

  it('loses at zero lives and stops stepping', () => {
    const sim = make([wave(0, rush('boss_don', 1, 1))]);
    sim.startWave();
    const evs = drain(sim, 60 * 60 * 10);
    expect(sim.phase).toBe('lost');
    expect(sim.lives).toBe(0);
    expect(evs.some((e) => e.t === 'lost')).toBe(true);
    expect(sim.step()).toEqual([]);
  });

  it('flags low lives once', () => {
    const sim = make([wave(0, rush('lhd', 4, 0.2))]);
    sim.startWave();
    const evs = drain(sim, 60 * 120);
    expect(evs.filter((e) => e.t === 'lowLives')).toHaveLength(1);
  });

  it('only sends the next wave once the current one has finished spawning, and AUTO chains them', () => {
    const sim = make([wave(10, rush('rhib', 3, 1)), wave(10, rush('rhib', 3, 1)), wave(10, rush('rhib', 1, 1))]);
    expect(sim.startWave()).toBe(true);
    expect(sim.startWave()).toBe(false);
    run(sim, 2 * 60 + 2);
    expect(sim.canStartWave()).toBe(true);
    expect(sim.startWave()).toBe(true);
    expect(sim.wave).toBe(2);
    sim.setAuto(true);
    run(sim, 60 * 60);
    expect(sim.wave).toBe(3);
    expect(sim.phase).toBe('won');
  });
});

describe('towers', () => {
  it('a speedboat pier sinks a RHIB', () => {
    const sim = make([wave(0, rush('rhib', 1, 1))]);
    expect(sim.place('boats', 5, 4)).not.toBeNull();
    sim.startWave();
    drain(sim);
    expect(sim.kills).toBe(1);
    expect(sim.lives).toBe(100);
    expect(sim.score).toBe(ENEMIES.rhib.score);
  });

  it('canPlace explains why not', () => {
    const sim = new Sim(mini([], { towers: ['boats', 'mines'], startCash: 200 }), TOWERS, ENEMIES);
    expect(sim.canPlace('boats', 5, 4)).toEqual({ ok: true });
    expect(sim.canPlace('sam', 5, 4).reason).toBe('locked');
    expect(sim.canPlace('boats', 5, 5).reason).toBe('terrain'); // lane
    expect(sim.canPlace('boats', 5, 6).reason).toBe('terrain'); // shallows are for sea towers
    expect(sim.canPlace('mines', 5, 4).reason).toBe('terrain');
    expect(sim.canPlace('boats', 5, 0).reason).toBe('terrain'); // row 0 never
    expect(sim.canPlace('boats', 30, 4).reason).toBe('bounds');
    expect(sim.canPlace('mines', 5, 6).reason).toBe('cash');
    sim.place('boats', 5, 4);
    sim.cash = 1000;
    expect(sim.canPlace('boats', 5, 4).reason).toBe('occupied');
  });

  it('sells for 70% of everything spent and caps upgrades at tier 3', () => {
    const sim = make();
    const t = sim.place('boats', 5, 4)!;
    const c0 = sim.cash;
    expect(sim.upgrade(t)).toBe(true);
    expect(sim.upgrade(t)).toBe(true);
    expect(sim.upgrade(t)).toBe(false);
    expect(sim.upgradeCost(t)).toBeNull();
    expect(t.tier).toBe(2);
    const spent = 180 + 160 + 300;
    expect(c0 - sim.cash).toBe(160 + 300);
    expect(sim.sellValue(t)).toBe(Math.floor(spent * 0.7));
    const before = sim.cash;
    expect(sim.sell(t)).toBe(true);
    expect(sim.cash).toBe(before + Math.floor(spent * 0.7));
    expect(sim.towers).toHaveLength(0);
  });

  it('cycles targeting', () => {
    const sim = make();
    const t = sim.place('boats', 5, 4)!;
    const seen = [t.targeting];
    for (let i = 0; i < 4; i++) {
      sim.setTargeting(t);
      seen.push(t.targeting);
    }
    expect(seen).toEqual(['first', 'last', 'strong', 'close', 'first']);
  });
});

describe('layer, armour and stealth rules', () => {
  it('sea towers ignore aircraft and the AA pit ignores ships until tier 3', () => {
    const sim = make();
    const boats = sim.place('boats', 5, 4)!;
    const aa = sim.place('aa_gun', 8, 4)!;
    const reaper = drop(sim, 'reaper', 120);
    const rhib = drop(sim, 'rhib', 300);
    run(sim, 240);
    expect(reaper.alive).toBe(false); // only the AA pit can have done it
    expect(rhib.alive).toBe(true); // out of the pier's reach, and the AA pit won't touch it
    expect(boats.kills).toBe(0);
    expect(aa.kills).toBe(1);
    sim.upgrade(aa);
    sim.upgrade(aa);
    expect(tierOf(aa).hitsSea).toBe(true);
    const sea = drop(sim, 'rhib', 200);
    run(sim, 120);
    expect(sea.alive).toBe(false);
  });

  it('armour ignores bullets but not explosives', () => {
    const sim = make();
    const boats = sim.place('boats', 5, 4)!;
    const burke = drop(sim, 'burke', 100);
    const evs = run(sim, 60);
    expect(burke.hp).toBe(ENEMIES.burke.hp);
    // bullet towers don't even waste rounds on armour
    expect(evs.some((e) => e.t === 'shoot')).toBe(false);
    sim.upgrade(boats); // 107mm rockets are explosive
    run(sim, 120);
    expect(burke.hp).toBeLessThan(ENEMIES.burke.hp);
  });

  it('stealth needs a radar, a Ghadir (subs only) or a FATWA', () => {
    const sim = make();
    sim.place('boats', 6, 4);
    const sub = drop(sim, 'sub', 150);
    run(sim, 60);
    expect(sub.revealed).toBe(false);
    expect(sub.hp).toBe(ENEMIES.sub.hp);

    const withRadar = make();
    withRadar.place('boats', 6, 4);
    withRadar.place('radar', 3, 3);
    const sub2 = drop(withRadar, 'sub', 150);
    run(withRadar, 30);
    expect(sub2.revealed).toBe(true);
    expect(sub2.hp).toBeLessThan(ENEMIES.sub.hp);

    const withGhadir = make();
    withGhadir.place('ghadir', 6, 6);
    const sub3 = drop(withGhadir, 'sub', 150);
    const b2 = drop(withGhadir, 'b2', 150);
    run(withGhadir, 10);
    expect(sub3.revealed).toBe(true);
    expect(b2.revealed).toBe(false);

    const withFatwa = make();
    const sub4 = drop(withFatwa, 'sub', 150);
    withFatwa.step();
    expect(withFatwa.ability('fatwa', sub4.x, sub4.y)).toBe(true);
    expect(sub4.revealed).toBe(true);
    expect(sub4.markTicks).toBeGreaterThan(0);
  });

  it('mines hit hidden subs', () => {
    const sim = make([wave(0, rush('sub', 1, 1, 0.5))]);
    sim.place('mines', 4, 6);
    sim.startWave();
    const evs = run(sim, 60 * 8);
    const subHits = evs.filter((e) => e.t === 'hit' && sim.enemyById(e.id) === undefined);
    expect(evs.some((e) => e.t === 'splash' && e.kind === 'mine')).toBe(true);
    expect(subHits.length + sim.kills).toBeGreaterThan(0);
    expect(sim.enemies.every((e) => !e.revealed)).toBe(true);
  });

  it('Ghadir torpedoes do double damage to subs', () => {
    const sim = make();
    const g = sim.place('ghadir', 6, 6)!;
    const sub = drop(sim, 'sub', 150);
    const evs = run(sim, 120);
    const hits = evs.filter((e) => e.t === 'hit' && e.id === sub.id);
    expect(hits.length).toBeGreaterThan(0);
    expect((hits[0] as { dmg: number }).dmg).toBe(g.def.base.damage * 2);
  });
});

describe('support towers', () => {
  it('the jammer slows ships in range and its top tier freezes them', () => {
    const sim = make();
    const j = sim.place('jammer', 8, 4)!;
    const rhib = drop(sim, 'rhib', 200);
    run(sim, 20);
    expect(rhib.slowTicks).toBeGreaterThan(0);
    expect(rhib.slowMult).toBeCloseTo(0.6);
    const d0 = rhib.d;
    sim.step();
    expect(rhib.d - d0).toBeCloseTo(((40 * ENEMIES.rhib.speed) / 60) * 0.6, 5);
    sim.upgrade(j);
    sim.upgrade(j);
    j.stunAcc = j.def.paths[0].tiers[1].stun!.every;
    const evs = run(sim, 2);
    expect(evs.some((e) => e.t === 'jam')).toBe(true);
    expect(rhib.stunTicks).toBeGreaterThan(0);
  });

  it('buffs take the max, never the sum', () => {
    const sim = make();
    const boats = sim.place('boats', 6, 4)!;
    const r1 = sim.place('radar', 5, 3)!;
    const r2 = sim.place('radar', 7, 3)!;
    for (const r of [r1, r2]) {
      sim.upgrade(r);
      sim.upgrade(r);
    }
    expect(boats.buff.dmg).toBeCloseTo(1.2);
    expect(boats.buff.range).toBeCloseTo(1.15);
    const m1 = sim.place('minaret', 6, 3)!;
    sim.place('minaret', 6, 2);
    expect(boats.buff.rate).toBeCloseTo(1.25);
    sim.sell(m1);
    expect(boats.buff.rate).toBeCloseTo(1.25);
    expect(r1.buff.dmg).toBe(1); // supports don't buff each other
  });

  it('the sermon pays only while a wave runs', () => {
    const sim = make([wave(0, rush('carrier', 1, 1))]);
    const m = sim.place('minaret', 10, 3)!;
    sim.upgrade(m);
    sim.upgrade(m);
    const c0 = sim.cash;
    run(sim, 60 * 31);
    expect(sim.cash).toBe(c0);
    sim.startWave();
    const evs = run(sim, 60 * 31);
    expect(evs.filter((e) => e.t === 'income')).toHaveLength(1);
  });
});

describe('children, mines, boats, abilities', () => {
  it('a carrier spills burkes and hornets when it sinks', () => {
    const sim = make();
    const carrier = drop(sim, 'carrier', 300);
    carrier.hp = 1;
    sim.place('missile', 10, 3);
    run(sim, 60 * 4);
    expect(carrier.alive).toBe(false);
    const kinds = sim.enemies.map((e) => e.def.key);
    expect(kinds.filter((k) => k === 'burke').length + kinds.filter((k) => k === 'frigate').length).toBeGreaterThan(0);
    expect(kinds.filter((k) => k === 'hornet')).toHaveLength(4);
  });

  it('mines are laid during waves only and detonate under ships', () => {
    const sim = make([wave(0, rush('patrol', 6, 1.5, 3))]);
    const m = sim.place('mines', 6, 6)!;
    run(sim, 60 * 5);
    expect(sim.projectiles.filter((p) => p.kind === 'mine')).toHaveLength(0);
    sim.startWave();
    run(sim, 60 * 2.5);
    expect(sim.projectiles.filter((p) => p.kind === 'mine').length).toBeGreaterThan(0);
    expect(m.alive).toBeLessThanOrEqual(3);
    const evs = drain(sim);
    expect(evs.some((e) => e.t === 'splash' && e.kind === 'mine')).toBe(true);
  });

  it('martyr boats drive up the lane and blow up on contact', () => {
    const sim = make();
    sim.place('martyr', 12, 6);
    const burke = drop(sim, 'burke', 200);
    const evs = run(sim, 60 * 6);
    expect(evs.some((e) => e.t === 'shoot' && e.kind === 'boat')).toBe(true);
    expect(evs.some((e) => e.t === 'splash' && e.kind === 'explosive')).toBe(true);
    expect(burke.hp).toBeLessThan(ENEMIES.burke.hp);
  });

  it('the staff slam stuns everything nearby and then needs a minute', () => {
    const sim = make();
    const a = drop(sim, 'frigate', 200);
    const b = drop(sim, 'boss_yacht', 220);
    sim.step();
    expect(sim.ability('staff', a.x, a.y)).toBe(true);
    expect(a.stunTicks).toBe(180);
    expect(b.stunTicks).toBe(60);
    expect(a.hp).toBe(ENEMIES.frigate.hp - 20);
    expect(sim.ability('staff', a.x, a.y)).toBe(false);
    expect(sim.abilityCooldown('staff')).toBe(3600);
  });

  it('FATWA is locked before level 6 and needs a target', () => {
    const early = new Sim(mini([], { n: 3 }), TOWERS, ENEMIES);
    drop(early, 'rhib', 100);
    early.step();
    expect(early.ability('fatwa', early.enemies[0].x, early.enemies[0].y)).toBe(false);
    const sim = make();
    expect(sim.ability('fatwa', 400, 400)).toBe(false);
    expect(sim.abilityCooldown('fatwa')).toBe(0);
  });

  it('boss yachts launch drones while they sail', () => {
    const sim = make();
    drop(sim, 'boss_yacht', 10);
    const evs = run(sim, 60 * 17);
    expect(evs.filter((e) => e.t === 'bossSpawn')).toHaveLength(2);
  });
});

describe('upgrade paths', () => {
  it('path B applies its own stats and the path locks after the first step', () => {
    const sim = make();
    const aa = sim.place('aa_gun', 8, 4)!;
    expect(sim.upgradeCost(aa, 1)).toBe(aa.def.paths[1].tiers[0].cost);
    expect(sim.upgrade(aa, 1)).toBe(true);
    expect(aa.path).toBe(1);
    expect(tierOf(aa).name).toBe('37MM FLAK');
    expect(tierOf(aa).splash).toBeGreaterThan(0);
    // asking for path A now follows the chosen path B
    expect(sim.upgradeCost(aa, 0)).toBe(aa.def.paths[1].tiers[1].cost);
    expect(sim.upgrade(aa, 0)).toBe(true);
    expect(aa.path).toBe(1);
    expect(tierOf(aa).name).toBe('RADAR FLAK');
    expect(sim.upgradeCost(aa)).toBeNull();
    expect(sim.upgrade(aa, 1)).toBe(false);
  });

  it('sells for a share of base plus both path B steps', () => {
    const sim = make();
    const m = sim.place('mines', 8, 6)!;
    sim.upgrade(m, 1);
    sim.upgrade(m, 1);
    const paid = m.def.base.cost + m.def.paths[1].tiers[0].cost + m.def.paths[1].tiers[1].cost;
    expect(m.spent).toBe(paid);
    const cash = sim.cash;
    expect(sim.sell(m)).toBe(true);
    expect(sim.cash).toBe(cash + Math.floor(paid * 0.7));
  });

  it('the targeting jammer paints enemies for extra damage without revealing stealth', () => {
    const sim = make();
    const j = sim.place('jammer', 8, 4)!;
    sim.upgrade(j, 1);
    const frigate = drop(sim, 'frigate', 230);
    const sub = drop(sim, 'sub', 230);
    run(sim, 12);
    expect(frigate.paintTicks).toBeGreaterThan(0);
    expect(frigate.paintMult).toBeCloseTo(1.2);
    expect(sub.revealed).toBe(false);
    const hp = frigate.hp;
    damage(sim, frigate, 10, 'explosive');
    expect(hp - frigate.hp).toBeCloseTo(12);
  });

  it('emits the chosen path with the upgrade event', () => {
    const sim = make();
    const b = sim.place('boats', 6, 4)!;
    sim.step();
    sim.upgrade(b, 1);
    const evs = sim.step();
    expect(evs.some((e) => e.t === 'tower' && e.op === 'upgrade' && e.path === 1)).toBe(true);
  });
});

describe('determinism', () => {
  const play = (seed: number) => {
    const sim = make([wave(50, rush('patrol', 10, 0.4), rush('reaper', 4, 1)), wave(50, rush('cyclone', 6, 0.8))], seed);
    sim.place('boats', 6, 4);
    sim.place('mines', 9, 6);
    sim.place('aa_gun', 12, 4);
    sim.place('shahed', 14, 3);
    sim.startWave();
    run(sim, 60 * 6);
    sim.startWave();
    run(sim, 60 * 10);
    return JSON.stringify(sim.snapshot());
  };

  it('replays identically for the same seed and inputs', () => {
    expect(play(42)).toBe(play(42));
  });

  it('differs for a different seed', () => {
    expect(play(42)).not.toBe(play(43));
  });

  it('replays mixed-path upgrades identically', () => {
    const mixed = () => {
      const sim = make([wave(50, rush('patrol', 10, 0.4), rush('reaper', 6, 0.8)), wave(50, rush('frigate', 4, 1))], 9);
      const b = sim.place('boats', 6, 4)!;
      const aa = sim.place('aa_gun', 12, 4)!;
      const j = sim.place('jammer', 9, 3)!;
      sim.upgrade(b, 1);
      sim.upgrade(aa, 0);
      sim.upgrade(j, 1);
      sim.startWave();
      run(sim, 60 * 6);
      sim.upgrade(b);
      sim.startWave();
      run(sim, 60 * 10);
      return JSON.stringify(sim.snapshot());
    };
    expect(mixed()).toBe(mixed());
  });
});

describe('events', () => {
  it('delivers events from player actions between ticks with the next step', () => {
    const sim = make([wave(0, rush('rhib', 1, 1))]);
    sim.place('boats', 5, 4);
    sim.startWave();
    const evs = sim.step();
    expect(evs.some((e) => e.t === 'tower' && e.op === 'place')).toBe(true);
    expect(evs.some((e) => e.t === 'waveStart')).toBe(true);
    expect(sim.step().some((e) => e.t === 'waveStart')).toBe(false);
  });
});

describe('multiple lanes', () => {
  const two = (waves: WaveDef[], over: Partial<ReturnType<typeof mini>> = {}) =>
    new Sim(mini(waves, { lanes: [[[-1, 5], [23, 5]], [[-1, 9], [10, 9]]], ...over }), TOWERS, ENEMIES);

  it('alternates enemies across lanes, and children keep their lane', () => {
    const sim = two([wave(0, rush('patrol', 4, 0.2))]);
    sim.startWave();
    run(sim, 60);
    const lanes = sim.enemies.map((e) => e.lane);
    expect(lanes.filter((l) => l === 0)).toHaveLength(2);
    expect(lanes.filter((l) => l === 1)).toHaveLength(2);
    const parent = sim.enemies.find((e) => e.lane === 1)!;
    damage(sim, parent, 99, 'explosive');
    const child = sim.enemies.find((e) => e.def.key === 'rhib')!;
    expect(child.lane).toBe(1);
  });

  it('a group can be pinned to a lane, and aircraft use the air lane', () => {
    const sim = two([wave(0, rush('rhib', 3, 0.2, 0, 1), rush('reaper', 3, 0.2))], { airLane: 0 });
    sim.startWave();
    run(sim, 60);
    expect(sim.enemies.filter((e) => e.def.key === 'rhib').every((e) => e.lane === 1)).toBe(true);
    expect(sim.enemies.filter((e) => e.def.key === 'reaper').every((e) => e.lane === 0)).toBe(true);
  });

  it('FIRST picks the ship closest to the tower whichever lane it is on', () => {
    const sim = two([]);
    // Same distance along, but lane 1 is far shorter, so its ship is nearer the Ayatower.
    const far = spawnEnemy(sim, 'rhib', 300, 0, 0, 0, 0);
    const near = spawnEnemy(sim, 'rhib', 300, 0, 0, 0, 1);
    expect(near.left).toBeLessThan(far.left);
    const t = sim.place('missile', 6, 4)!;
    expect(pickTarget(t, sim.enemies)).toBe(near);
    sim.setTargeting(t, 'last');
    expect(pickTarget(t, sim.enemies)).toBe(far);
  });

  it('mines only trigger for ships on their own lane', () => {
    const sim = two([]);
    const m = sim.place('mines', 4, 6)!;
    // lane 0 is right beside the layer, lane 1 is out of range
    expect(m.laneSpots.every((s) => s.lane === 0)).toBe(true);
    const other = spawnEnemy(sim, 'patrol', 0, 0, 0, 0, 1);
    sim.phase = 'wave'; // layers only work during a wave
    run(sim, 60 * 4);
    expect(other.hp).toBe(ENEMIES.patrol.hp);
  });
});
