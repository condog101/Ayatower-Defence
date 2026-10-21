import { cast } from './abilities';
import { SELL_RATE } from './const';
import { revealPass, spawnEnemy, stepEnemies } from './enemies';
import { cellCentre, isPlaceable, parseRows, type Grid } from './grid';
import { Lane } from './path';
import { stepProjectiles } from './projectiles';
import { mulberry32 } from './rng';
import { refreshBuffs, stepTowers } from './towers';
import {
  TARGETING_ORDER,
  type AbilityKey,
  type Enemy,
  type EnemyDef,
  type EnemyKey,
  type LevelDef,
  type Phase,
  type Projectile,
  type SimEvent,
  type Tower,
  type TowerDef,
  type TowerKey,
  type WaveDef,
} from './types';
import { WaveRunner } from './waves';

export type PlaceReason = 'cash' | 'terrain' | 'occupied' | 'locked' | 'bounds';

/** Ticks after a wave clears before AUTO sends the next one. */
const AUTO_DELAY = 45;

/**
 * One level of tower defence, stepped at a fixed 60 Hz. Deterministic for a given level seed and
 * input sequence: one seeded PRNG, integer ids, arrays kept in id order. No Phaser, no DOM.
 */
export class Sim {
  readonly grid: Grid;
  readonly lane: Lane;
  readonly rng: () => number;

  tick = 0;
  lives: number;
  cash: number;
  score = 0;
  killScore = 0;
  waveScore = 0;
  kills = 0;
  leaks = 0;
  /** Waves started so far (the current wave number, 1-based, while one runs). */
  wave = 0;
  phase: Phase = 'build';
  auto = false;
  towersBuilt = 0;
  lowLivesSaid = false;

  enemies: Enemy[] = [];
  towers: Tower[] = [];
  projectiles: Projectile[] = [];
  cooldowns: Record<AbilityKey, number> = { staff: 0, fatwa: 0 };
  nextId = 1;

  private runners: WaveRunner[] = [];
  private autoIn = 0;
  private events: SimEvent[] = [];
  private enemyIndex = new Map<number, Enemy>();
  private towerIndex = new Map<number, Tower>();

  constructor(
    readonly level: LevelDef,
    readonly towerDefs: Record<TowerKey, TowerDef>,
    readonly enemyDefs: Record<EnemyKey, EnemyDef>,
  ) {
    this.grid = parseRows(level.rows);
    this.lane = new Lane(level.lane);
    this.rng = mulberry32(level.seed);
    this.lives = level.lives;
    this.cash = level.startCash;
  }

  emit(ev: SimEvent) {
    this.events.push(ev);
    if (ev.t === 'spawn') this.enemyIndex.set(ev.id, this.enemies[this.enemies.length - 1]);
  }

  enemyById(id: number): Enemy | undefined {
    return this.enemyIndex.get(id);
  }

  towerById(id: number): Tower | undefined {
    return this.towerIndex.get(id);
  }

  get totalWaves(): number {
    return this.level.waves.length;
  }

  get over(): boolean {
    return this.phase === 'won' || this.phase === 'lost';
  }

  /**
   * Advance one tick and return what happened since the last call: the tick itself plus anything
   * the player did in between (placing, upgrading, starting a wave, casting).
   */
  step(): SimEvent[] {
    if (!this.over) this.tick_();
    const out = this.events;
    this.events = [];
    return out;
  }

  private tick_() {
    this.tick++;
    if (this.cooldowns.staff > 0) this.cooldowns.staff--;
    if (this.cooldowns.fatwa > 0) this.cooldowns.fatwa--;
    if (this.autoIn > 0 && --this.autoIn === 0 && this.phase === 'build') this.startWave();

    for (const r of this.runners) for (const kind of r.step()) spawnEnemy(this, kind, 0, r.wave);
    stepEnemies(this);
    if (this.lives <= 0) {
      this.phase = 'lost';
      this.emit({ t: 'lost' });
      return;
    }
    revealPass(this);
    stepTowers(this);
    stepProjectiles(this);
    this.compact();
    this.checkWaves();
  }

  private compact() {
    if (this.enemies.some((e) => !e.alive)) {
      for (const e of this.enemies) if (!e.alive) this.enemyIndex.delete(e.id);
      this.enemies = this.enemies.filter((e) => e.alive);
    }
    if (this.projectiles.some((p) => !p.alive)) this.projectiles = this.projectiles.filter((p) => p.alive);
  }

  private checkWaves() {
    for (const r of [...this.runners]) {
      if (!r.spawnedAll || this.enemies.some((e) => e.wave === r.wave)) continue;
      this.runners.splice(this.runners.indexOf(r), 1);
      const def = this.level.waves[r.wave - 1];
      this.cash += def.reward;
      this.score += def.reward;
      this.waveScore += def.reward;
      this.emit({ t: 'waveEnd', wave: r.wave, reward: def.reward });
    }
    if (this.phase === 'wave' && this.runners.length === 0) {
      if (this.wave >= this.totalWaves) {
        this.phase = 'won';
        this.emit({ t: 'won' });
      } else {
        this.phase = 'build';
        if (this.auto) this.autoIn = AUTO_DELAY;
      }
    }
  }

  /** The next wave can go once the current one has finished spawning (sending early is allowed). */
  canStartWave(): boolean {
    if (this.over || this.wave >= this.totalWaves) return false;
    return this.runners.every((r) => r.spawnedAll);
  }

  startWave(): boolean {
    if (!this.canStartWave()) return false;
    this.wave++;
    this.runners.push(new WaveRunner(this.wave, this.level.waves[this.wave - 1]));
    this.phase = 'wave';
    this.autoIn = 0;
    this.emit({ t: 'waveStart', wave: this.wave });
    return true;
  }

  setAuto(on: boolean) {
    this.auto = on;
    if (on && this.phase === 'build' && this.wave > 0) this.autoIn = AUTO_DELAY;
    if (!on) this.autoIn = 0;
  }

  nextWave(): WaveDef | null {
    return this.level.waves[this.wave] ?? null;
  }

  // ---- Towers ----

  towerAt(c: number, r: number): Tower | undefined {
    return this.towers.find((t) => t.c === c && t.r === r);
  }

  canPlace(key: TowerKey, c: number, r: number): { ok: boolean; reason?: PlaceReason } {
    const def = this.towerDefs[key];
    if (!this.level.towers.includes(key)) return { ok: false, reason: 'locked' };
    if (c < 0 || r < 0 || c >= this.grid[0].length || r >= this.grid.length) return { ok: false, reason: 'bounds' };
    if (!isPlaceable(this.grid, c, r, def.placement)) return { ok: false, reason: 'terrain' };
    if (this.towerAt(c, r)) return { ok: false, reason: 'occupied' };
    if (this.cash < def.tiers[0].cost) return { ok: false, reason: 'cash' };
    return { ok: true };
  }

  place(key: TowerKey, c: number, r: number): Tower | null {
    if (!this.canPlace(key, c, r).ok) return null;
    const def = this.towerDefs[key];
    const [x, y] = cellCentre(c, r);
    const t: Tower = {
      id: this.nextId++,
      def,
      tier: 0,
      c,
      r,
      x,
      y,
      spent: def.tiers[0].cost,
      cooldown: 0,
      targetId: 0,
      targeting: 'first',
      angle: -Math.PI / 2,
      buff: { range: 1, rate: 1, dmg: 1, bounty: 1 },
      alive: 0,
      stunAcc: 0,
      incomeAcc: 0,
      pulseAcc: 0,
      kills: 0,
      laneSpots: [],
      entryD: 0,
    };
    this.cash -= def.tiers[0].cost;
    this.towers.push(t);
    this.towerIndex.set(t.id, t);
    this.towersBuilt++;
    refreshBuffs(this);
    this.emit({ t: 'tower', op: 'place', id: t.id, key, tier: 0 });
    return t;
  }

  upgradeCost(t: Tower): number | null {
    return t.tier < 2 ? t.def.tiers[t.tier + 1].cost : null;
  }

  upgrade(t: Tower): boolean {
    const cost = this.upgradeCost(t);
    if (cost === null || this.cash < cost || !this.towerIndex.has(t.id)) return false;
    this.cash -= cost;
    t.spent += cost;
    t.tier = (t.tier + 1) as 1 | 2;
    refreshBuffs(this);
    this.emit({ t: 'tower', op: 'upgrade', id: t.id, key: t.def.key, tier: t.tier });
    return true;
  }

  sellValue(t: Tower): number {
    return Math.floor(t.spent * SELL_RATE);
  }

  sell(t: Tower): boolean {
    if (!this.towerIndex.has(t.id)) return false;
    this.cash += this.sellValue(t);
    this.towers = this.towers.filter((x) => x !== t);
    this.towerIndex.delete(t.id);
    // Its mines and boats go with it.
    for (const p of this.projectiles) {
      if (p.towerId === t.id && (p.kind === 'mine' || p.kind === 'boat') && p.alive) {
        p.alive = false;
        this.emit({ t: 'projDie', id: p.id, x: p.x, y: p.y });
      }
    }
    refreshBuffs(this);
    this.emit({ t: 'tower', op: 'sell', id: t.id, key: t.def.key, tier: t.tier });
    return true;
  }

  setTargeting(t: Tower, mode?: Tower['targeting']) {
    t.targeting = mode ?? TARGETING_ORDER[(TARGETING_ORDER.indexOf(t.targeting) + 1) % TARGETING_ORDER.length];
    t.targetId = 0;
  }

  // ---- Abilities ----

  ability(key: AbilityKey, x: number, y: number): boolean {
    return cast(this, key, x, y);
  }

  abilityCooldown(key: AbilityKey): number {
    return this.cooldowns[key];
  }

  /** Nearest live enemy to (x, y) within `radius`, stealthed or not. */
  enemyNear(x: number, y: number, radius: number): Enemy | null {
    let best: Enemy | null = null;
    let bestD2 = radius * radius;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d2 = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d2 <= bestD2) {
        bestD2 = d2;
        best = e;
      }
    }
    return best;
  }

  /** A compact, comparable picture of the state (determinism tests). */
  snapshot() {
    const r = (n: number) => Math.round(n * 100) / 100;
    return {
      tick: this.tick,
      lives: this.lives,
      cash: this.cash,
      score: this.score,
      kills: this.kills,
      wave: this.wave,
      phase: this.phase,
      enemies: this.enemies.map((e) => [e.id, e.def.key, r(e.hp), r(e.d)]),
      towers: this.towers.map((t) => [t.id, t.def.key, t.tier, t.kills]),
      projectiles: this.projectiles.map((p) => [p.id, p.kind, r(p.x), r(p.y)]),
    };
  }
}
