import { ZZFX, ZZFXSound } from 'zzfx';

// Procedural SFX. Parameter arrays are ZzFX format:
// [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide,
//  pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter]
const DEFS = {
  // DShK chatter: short noisy click
  shoot: [0.35, 0.05, 300, 0, 0.01, 0.05, 4, 1.4, -6, 0, 0, 0, 0, 0.8, 0, 0.2, 0, 0.6, 0.01],
  // 107mm rocket: a whoosh that falls away
  rocket: [0.4, 0.1, 500, 0.01, 0.08, 0.2, 4, 1, -4, 0, 0, 0, 0, 1.6, 0, 0, 0, 0.5, 0.05],
  // ZU-23 flak: rapid gritty pops
  flak: [0.3, 0.05, 520, 0, 0.008, 0.04, 4, 0.6, 0, 0, 0, 0, 0.02, 1, 0, 0.4, 0, 0.7, 0.01],
  // torpedo launch: bubbly low swoop
  torpedo: [0.5, 0.1, 160, 0.02, 0.15, 0.3, 0, 1, -1, 0, 0, 0, 0.05, 0.4, 8, 0, 0, 0.5, 0.05],
  // coastal missile: rising roar
  missile: [0.6, 0.1, 220, 0.05, 0.3, 0.4, 4, 1, 3, 0, 0, 0, 0, 1.5, 0, 0, 0, 0.6, 0.1],
  // mine dropped in the water: plip
  mine: [0.4, 0, 700, 0, 0.02, 0.1, 0, 1, -12, 0, 0, 0, 0, 0, 0, 0, 0, 0.5],
  // big wet boom (mines, martyr boats, ships sinking)
  boatBoom: [1, 0.1, 60, 0.01, 0.2, 0.8, 4, 0.5, -0.8, 0, 0, 0, 0, 1.8, 0, 0.45, 0.05, 0.45, 0.2],
  // small boom
  boom: [0.7, 0.1, 80, 0.01, 0.1, 0.4, 4, 0.5, -1, 0, 0, 0, 0, 1.6, 0, 0.4, 0, 0.5, 0.12],
  // EW capture: descending warble
  freeze: [0.4, 0, 900, 0.02, 0.2, 0.3, 1, 1, -3, 0, 0, 0, 0.06, 0, 30, 0, 0, 0.6],
  // radar ping
  radarPing: [0.25, 0, 1600, 0, 0.03, 0.3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0.12, 0.4],
  place: [0.5, 0, 180, 0, 0.04, 0.12, 3, 1, 0, 0, 120, 0.04, 0, 0.5, 0, 0, 0, 0.7],
  upgrade: [0.5, 0, 400, 0, 0.06, 0.2, 0, 1.4, 0, 0, 300, 0.05, 0.06, 0, 0, 0, 0, 0.8],
  sell: [0.45, 0, 900, 0, 0.04, 0.15, 0, 1, 0, 0, -300, 0.05, 0, 0, 0, 0, 0, 0.8],
  cash: [0.3, 0, 1300, 0, 0.02, 0.12, 0, 1.6, 0, 0, 600, 0.03, 0, 0, 0, 0, 0, 0.8],
  // a ship got past: low klaxon
  leak: [0.45, 0, 260, 0.02, 0.18, 0.05, 2, 1, 0, 0, -60, 0.1, 0, 0, 0, 0, 0, 0.9],
  // wave start: war horn
  waveStart: [0.6, 0, 196, 0.06, 0.35, 0.2, 2, 1, 0, 0, 98, 0.12, 0, 0, 6, 0, 0, 0.9, 0.05],
  waveEnd: [0.5, 0, 523, 0, 0.08, 0.2, 0, 1.2, 0, 0, 262, 0.08, 0, 0, 0, 0, 0, 0.8],
  // boss alarm (played x3)
  bossIntro: [0.8, 0, 220, 0.03, 0.3, 0.2, 2, 1, 0, 0, 110, 0.07, 0, 0, 22, 0, 0, 0.9, 0.05],
  // Censor tone: 1 kHz sine, held; retriggered while the typewriter is inside a bleeped word.
  bleep: [0.5, 0, 1000, 0.005, 0.25, 0.02, 0],
  blip: [0.2, 0, 1200, 0, 0.005, 0.02, 1],
  select: [0.45, 0.1, 2400, 0, 0.004, 0.03, 4, 2, 0, 0, 0, 0, 0, 1, 0, 0.2],
  // incoming dispatch: a scrape and a chime
  incoming: [0.5, 0.1, 880, 0.005, 0.06, 0.15, 0, 1.5, 0, 0, 220, 0.05, 0, 0.3, 0, 0, 0, 0.7],
  // level clear: rising fanfare (played x3)
  clear: [0.6, 0, 392, 0.03, 0.2, 0.14, 2, 1, 0, 0, 196, 0.05, 0, 0, 0, 0, 0, 0.9, 0.04],
  death: [1, 0.05, 220, 0.05, 0.55, 1.1, 1, 1, -5, 0, 0, 0, 0, 0.4, 0, 0.3, 0.2, 0.6, 0.3],
  // YOU SHAH-LL NOT PASS: a staff hitting stone plus a bass drop
  slam: [1.4, 0.05, 45, 0.01, 0.35, 1.2, 0, 1, -0.3, 0, 0, 0, 0, 0.8, 0, 0.3, 0.1, 0.6, 0.3],
} satisfies Record<string, number[]>;

export type Sfx = keyof typeof DEFS;

/** Sounds that re-fire: [count, gap ms]. Horns come in threes. */
const REPEATS: Partial<Record<Sfx, [number, number]>> = { clear: [3, 220], bossIntro: [3, 360] };
/** Sounds layered on top of another. */
const LAYERS: Partial<Record<Sfx, Sfx>> = { slam: 'boatBoom' };

class AudioSystem {
  private sounds = new Map<Sfx, ZZFXSound>();
  private lastPlayed = new Map<Sfx, number>();
  private volume = 0.6;

  private get(name: Sfx): ZZFXSound {
    let s = this.sounds.get(name);
    if (!s) {
      s = new ZZFXSound(DEFS[name]);
      this.sounds.set(name, s);
    }
    return s;
  }

  setVolume(v: number) {
    this.volume = v;
    ZZFX.volume = 0.3 * v;
  }

  getVolume() {
    return this.volume;
  }

  /** Browsers start the AudioContext suspended until a user gesture. */
  unlock() {
    if (ZZFX.audioContext.state !== 'running') void ZZFX.audioContext.resume();
  }

  play(name: Sfx, opts: { volume?: number; pitch?: number; pan?: number; minGapMs?: number } = {}) {
    if (this.volume <= 0 || ZZFX.audioContext.state !== 'running') return;
    const now = performance.now();
    const gap = opts.minGapMs ?? 30;
    if (now - (this.lastPlayed.get(name) ?? 0) < gap) return;
    this.lastPlayed.set(name, now);
    this.get(name).play(opts.volume ?? 1, opts.pitch ?? 1, 1, opts.pan ?? 0);
    const layer = LAYERS[name];
    if (layer) this.get(layer).play(opts.volume ?? 1, 0.8, 1, opts.pan ?? 0);
    const rep = REPEATS[name];
    if (rep) {
      for (let i = 1; i < rep[0]; i++) {
        setTimeout(() => this.get(name).play(opts.volume ?? 1, (opts.pitch ?? 1) * (i === rep[0] - 1 ? 1.06 : 1), 1, opts.pan ?? 0), rep[1] * i);
      }
    }
  }

  /** Pre-render every sound so the first explosion doesn't hitch. */
  warm() {
    for (const k of Object.keys(DEFS) as Sfx[]) this.get(k);
  }
}

export const Audio = new AudioSystem();
