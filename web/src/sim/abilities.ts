import { sec } from './const';
import { damage } from './enemies';
import type { Sim } from './sim';
import type { AbilityKey } from './types';

export interface AbilityDef {
  key: AbilityKey;
  name: string;
  cooldown: number;
  unlockLevel: number;
  blurb: string;
}

export const ABILITIES: Record<AbilityKey, AbilityDef> = {
  staff: { key: 'staff', name: 'YOU SHAH-LL NOT PASS!', cooldown: sec(60), unlockLevel: 1, blurb: 'Staff slam: stuns everything near the tap for 3 s.' },
  fatwa: { key: 'fatwa', name: 'FATWA', cooldown: sec(35), unlockLevel: 6, blurb: 'Marks one ship: +50% damage taken, every tower targets it.' },
};

export const STAFF = { radius: 150, stun: sec(3), bossStun: sec(1), damage: 20 };
export const FATWA = { pick: 48, mark: sec(8), damage: 300 };

/** Cast an ability at map point (x, y). Returns false (and spends nothing) if it can't go off. */
export function cast(sim: Sim, key: AbilityKey, x: number, y: number): boolean {
  if (sim.level.n < ABILITIES[key].unlockLevel || sim.cooldowns[key] > 0) return false;
  if (sim.phase === 'won' || sim.phase === 'lost') return false;
  if (key === 'staff') {
    sim.cooldowns.staff = ABILITIES.staff.cooldown;
    sim.emit({ t: 'ability', key, x, y });
    const r2 = STAFF.radius ** 2;
    for (const e of [...sim.enemies]) {
      if (!e.alive || (e.x - x) ** 2 + (e.y - y) ** 2 > r2) continue;
      e.stunTicks = Math.max(e.stunTicks, e.def.boss ? STAFF.bossStun : STAFF.stun);
      damage(sim, e, STAFF.damage, 'explosive');
    }
    return true;
  }
  const target = sim.enemyNear(x, y, FATWA.pick);
  if (!target) return false;
  sim.cooldowns.fatwa = ABILITIES.fatwa.cooldown;
  target.markTicks = FATWA.mark;
  target.revealed = true;
  sim.emit({ t: 'ability', key, x: target.x, y: target.y, target: target.id });
  damage(sim, target, FATWA.damage, 'missile');
  return true;
}
