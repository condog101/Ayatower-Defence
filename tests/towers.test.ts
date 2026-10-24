import { describe, expect, it } from 'vitest';
import { LEVELS } from '../web/src/data/levels';
import { TOWER_KEYS, TOWERS } from '../web/src/data/towers';
import { allTiers } from '../web/src/sim/tiers';

const all = Object.values(TOWERS);

describe('towers', () => {
  it('has the eleven towers in sprite order', () => {
    expect(TOWER_KEYS).toHaveLength(11);
    TOWER_KEYS.forEach((k, i) => {
      expect(TOWERS[k].key).toBe(k);
      expect(TOWERS[k].index).toBe(i);
    });
  });

  it('costs are positive and every path costs more at its second step', () => {
    for (const t of all) {
      for (const tier of allTiers(t)) expect(tier.cost, `${t.key} ${tier.name}`).toBeGreaterThan(0);
      for (const p of t.paths) expect(p.tiers[1].cost, `${t.key} ${p.name}`).toBeGreaterThanOrEqual(p.tiers[0].cost);
    }
  });

  it('has two upgrade paths per tower, with distinct names', () => {
    for (const t of all) {
      expect(t.paths, t.key).toHaveLength(2);
      expect(t.paths[0].name, t.key).not.toBe(t.paths[1].name);
      const names = allTiers(t).map((x) => x.name);
      expect(new Set(names).size, `${t.key} tier names`).toBe(names.length);
    }
  });

  it('support towers do no damage and fire nothing; attack towers do', () => {
    for (const t of all) {
      for (const tier of allTiers(t)) {
        if (t.role === 'support') {
          expect(tier.projectile, t.key).toBe('none');
          expect(tier.damage, t.key).toBe(0);
          expect(!!(tier.slow || tier.reveal || tier.buff || tier.income || tier.paint), t.key).toBe(true);
        } else {
          expect(tier.projectile, t.key).not.toBe('none');
          expect(tier.damage, t.key).toBeGreaterThan(0);
          expect(tier.cooldown, t.key).toBeGreaterThanOrEqual(1);
          expect(tier.range, t.key).toBeGreaterThan(0);
          expect(tier.hitsSea || tier.hitsAir, t.key).toBe(true);
        }
      }
    }
  });

  it('only aimed towers have turret strips', () => {
    expect(all.filter((t) => t.aimed).map((t) => t.key)).toEqual(['boats', 'aa_gun', 'missile', 'sam']);
  });

  it('only the Mesbah and the flak skiffs hit both sea and air', () => {
    const dual = all.flatMap((t) => (t.role === 'attack' ? allTiers(t).filter((x) => x.hitsSea && x.hitsAir).map((x) => `${t.key}:${x.name}`) : []));
    expect(dual.sort()).toEqual(['aa_gun:MESBAH', 'boats:MANPADS SKIFFS', 'boats:PICKET LINE']);
  });

  it('sea towers go in the shallows, the rest on land', () => {
    expect(all.filter((t) => t.placement === 'shallow').map((t) => t.key)).toEqual(['mines', 'martyr', 'ghadir']);
  });

  it('unlock levels match the first level that offers each tower', () => {
    for (const t of all) {
      const first = LEVELS.find((l) => l.towers.includes(t.key));
      if (first) expect(first.n, t.key).toBe(t.unlockLevel);
      else expect(t.unlockLevel, t.key).toBeGreaterThan(LEVELS.length);
    }
  });
});
