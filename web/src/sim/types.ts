// Data and runtime types for the Phaser-free simulation. Positions are map-space px (0..800, 0..512),
// durations are ticks (60 per second) unless a field says otherwise.

export type Layer = 'sea' | 'air';
export type DmgKind = 'bullet' | 'explosive' | 'missile' | 'torpedo' | 'mine';
export type ProjectileKind = 'hitscan' | 'shot' | 'homing' | 'splash' | 'mine' | 'boat' | 'none';
export type Targeting = 'first' | 'last' | 'strong' | 'close';
export const TARGETING_ORDER: Targeting[] = ['first', 'last', 'strong', 'close'];

export type EnemyKey =
  | 'rhib'
  | 'patrol'
  | 'cyclone'
  | 'lcs'
  | 'frigate'
  | 'burke'
  | 'sub'
  | 'tico'
  | 'lhd'
  | 'carrier'
  | 'reaper'
  | 'seahawk'
  | 'hornet'
  | 'b2'
  | 'zumwalt'
  | 'lcac'
  | 'f35'
  | 'ohio'
  | 'boss_yacht'
  | 'boss_don'
  | 'boss_af1'
  | 'boss_resort';

export type TowerKey =
  | 'boats'
  | 'mines'
  | 'martyr'
  | 'aa_gun'
  | 'shahed'
  | 'jammer'
  | 'missile'
  | 'radar'
  | 'ghadir'
  | 'sam'
  | 'minaret';

export interface EnemyDef {
  key: EnemyKey;
  name: string;
  /** One word for the HUD's wave preview. */
  short: string;
  layer: Layer;
  hp: number;
  /** Multiple of BASE_SPEED px/s. */
  speed: number;
  /** Lives (PATIENCE) lost if it reaches the Ayatower. */
  leak: number;
  /** RIALS bounty. */
  cash: number;
  score: number;
  /** Hit radius, px. */
  radius: number;
  armoured?: boolean;
  stealth?: boolean;
  /** A submarine: Ghadirs detect it and hit it harder, it dives and surfaces. */
  sub?: boolean;
  boss?: boolean;
  fast?: boolean;
  big?: boolean;
  /** Spawned at the parent's lane distance when it dies. */
  children?: { kind: EnemyKey; n: number }[];
  /** Launched while alive (bosses): one `kind` every `everyTicks`, at most `max`. */
  spawns?: { kind: EnemyKey; everyTicks: number; max: number };
  /** First level it appears on. */
  introLevel: number;
  /** Sprite sheet key. */
  sprite: string;
}

export interface Buff {
  range?: number;
  rate?: number;
  dmg?: number;
  bounty?: number;
}

export interface TierDef {
  name: string;
  /** Place cost (base) or upgrade cost (path steps). */
  cost: number;
  range: number;
  cooldown: number;
  damage: number;
  dmgKind: DmgKind;
  projectile: ProjectileKind;
  /** Projectile speed px/s. */
  speed?: number;
  splash?: number;
  pierce?: number;
  /** Mines alive per tower (mine layer) / boats alive per dock (martyr). */
  maxAlive?: number;
  /** Targets (or boats) per shot. */
  multishot?: number;
  hitsSea: boolean;
  hitsAir: boolean;
  /** Smart mines skip small fry (hp at or below this). */
  ignoreHp?: number;
  /** Jammer: slow everything in range on matching layers. */
  slow?: { mult: number; ticks: number };
  /** Jammer T3: every `every` ticks freeze everything in range for `ticks` (bosses a third). */
  stun?: { ticks: number; every: number };
  /** Jammer path B: enemies in range take `mult`x damage (does not reveal stealth). */
  paint?: { mult: number; ticks: number };
  /** Reveals stealth enemies within this radius. */
  reveal?: number;
  /** Reveals submarines (only) within this radius. */
  detectsSub?: number;
  /** Damage multiplier against submarines. */
  subMult?: number;
  /** Support aura for attack towers whose centre is within `range`. */
  buff?: Buff;
  /** Passive RIALS. */
  income?: { amount: number; everyTicks: number };
  /** One line for the shop / panel. */
  blurb: string;
}

export interface TowerDef {
  key: TowerKey;
  name: string;
  /** Real-world basis, for the panel. */
  basis: string;
  pro: string;
  con: string;
  placement: 'land' | 'shallow';
  role: 'attack' | 'support';
  unlockLevel: number;
  /**
   * towers.png frame = index * 5 + slot (slot 0 base, 1-2 path A, 3-4 path B, see tierSlot);
   * aimed towers: turrets.png frame = (aimedIndex * 5 + slot) * 8 + direction.
   */
  index: number;
  aimed: boolean;
  base: TierDef;
  /** Two upgrade paths of two steps each; the first upgrade picks one for good. */
  paths: [UpgradePath, UpgradePath];
}

export type PathIndex = 0 | 1;

export interface UpgradePath {
  name: string;
  tiers: [TierDef, TierDef];
}

export interface WaveGroup {
  kind: EnemyKey;
  n: number;
  /** Which lane: an index, or 'alt' (default) to alternate lanes enemy by enemy. Air groups default to the level's airLane. */
  lane?: number | 'alt';
  /** Seconds between spawns. */
  gap: number;
  /** Seconds after the wave starts before the first spawn. */
  delay: number;
}

export interface WaveDef {
  groups: WaveGroup[];
  /** RIALS (and score) for clearing the wave. */
  reward: number;
  boss?: boolean;
}

export interface LevelDef {
  n: number;
  name: string;
  sub: string;
  brief: string;
  /** 16 rows of 25 legend characters (see grid.ts). */
  rows: string[];
  /**
   * One to three lanes, each a list of waypoints in cell coords joined along straight or 45 degree
   * runs. Every lane starts off the map and ends orthogonally beside the Ayatower; lanes may share
   * cells where they merge.
   */
  lanes: [number, number][][];
  /** The lane aircraft fly by default (e.g. a straight air corridor); otherwise they alternate like ships. */
  airLane?: number;
  startCash: number;
  lives: number;
  towers: TowerKey[];
  waves: WaveDef[];
  bossName?: string;
  seed: number;
}

export interface Status {
  slowMult: number;
  slowTicks: number;
  stunTicks: number;
  markTicks: number;
  paintTicks: number;
  paintMult: number;
}

export interface Enemy extends Status {
  id: number;
  def: EnemyDef;
  hp: number;
  maxHp: number;
  /** Which lane it sails, and how far along it. */
  lane: number;
  d: number;
  /** Distance still to sail to the Ayatower (lane length - d), kept up to date as it moves. */
  left: number;
  lateral: number;
  x: number;
  y: number;
  angle: number;
  alive: boolean;
  revealed: boolean;
  wave: number;
  /** 0 for wave spawns, parent's + 1 for children and boss launches (bounty halves per generation). */
  gen: number;
  spawnAcc: number;
  spawned: number;
}

export interface Tower {
  id: number;
  def: TowerDef;
  tier: 0 | 1 | 2;
  /** The upgrade path; 0 until the first upgrade picks one. */
  path: PathIndex;
  c: number;
  r: number;
  x: number;
  y: number;
  spent: number;
  cooldown: number;
  targetId: number;
  targeting: Targeting;
  angle: number;
  buff: Required<Buff>;
  alive: number;
  stunAcc: number;
  incomeAcc: number;
  pulseAcc: number;
  kills: number;
  /** Lane points within range (mine layer drop spots). */
  laneSpots: LanePoint[];
  /** The lane point nearest the tower (martyr boats join the lane here). */
  entry: LanePoint;
}

export interface Projectile {
  id: number;
  kind: ProjectileKind;
  towerId: number;
  /** Sprite key for the view. */
  sprite: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  targetId: number;
  damage: number;
  dmgKind: DmgKind;
  splash: number;
  pierce: number;
  hitIds: number[];
  ttl: number;
  hitsSea: boolean;
  hitsAir: boolean;
  /** Mines and boats: lane and distance along it; splash shells: landing point in tx/ty. */
  lane: number;
  d: number;
  tx: number;
  ty: number;
  /** Boats: 0 heading for the lane, 1 driving up the lane. */
  stage: number;
  ignoreHp: number;
  subMult: number;
  alive: boolean;
}

export interface LanePoint {
  lane: number;
  d: number;
}

export type AbilityKey = 'staff' | 'fatwa';

export type SimEvent =
  | { t: 'spawn'; id: number }
  | { t: 'shoot'; tower: number; x: number; y: number; tx: number; ty: number; kind: ProjectileKind; sprite: string }
  | { t: 'hit'; id: number; x: number; y: number; dmg: number; immune?: boolean }
  | { t: 'splash'; x: number; y: number; r: number; kind: DmgKind; water: boolean }
  | { t: 'die'; id: number; key: EnemyKey; x: number; y: number; cash: number; big: boolean; layer: Layer }
  | { t: 'leak'; id: number; key: EnemyKey; lives: number }
  | { t: 'projDie'; id: number; x: number; y: number }
  | { t: 'waveStart'; wave: number }
  | { t: 'waveEnd'; wave: number; reward: number }
  | { t: 'tower'; op: 'place' | 'upgrade' | 'sell'; id: number; key: TowerKey; tier: number; path: PathIndex }
  | { t: 'jam'; tower: number; freeze: boolean }
  | { t: 'income'; tower: number; amount: number }
  | { t: 'ability'; key: AbilityKey; x: number; y: number; target?: number }
  | { t: 'bossSpawn'; id: number }
  | { t: 'lowLives' }
  | { t: 'won' }
  | { t: 'lost' };

export type Phase = 'build' | 'wave' | 'won' | 'lost';
