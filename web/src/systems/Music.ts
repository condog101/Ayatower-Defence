import { ZZFX } from 'zzfx';
import { Audio } from './Audio';

/**
 * Procedural boom-bap. Drum and bass hits are rendered once with ZzFX's sample
 * builder, wrapped in AudioBuffers and scheduled on the AudioContext clock with
 * a short lookahead (the usual two-clocks pattern), so there is no extra
 * dependency and no audio files.
 */
export type Track = 'title' | 'game' | 'boss';

// ZzFX parameter arrays (see Audio.ts for the field order).
const SAMPLES = {
  // kick: sine from 80 Hz with a slow sweep that only reaches zero after the note has decayed
  // (a fast sweep crosses zero and bounces back up, which sounds like a spring)
  kick: [1.3, 0, 80, 0.002, 0.05, 0.2, 0, 1, -0.5, 0, 0, 0, 0, 0, 0, 0.1, 0, 0.5, 0.08],
  snare: [0.9, 0.05, 190, 0, 0.03, 0.17, 3, 1.2, 0, 0, 0, 0, 0, 1.4, 0, 0.3, 0, 0.5, 0.03],
  // hats: darker, filtered noise kept well under the snare so they sit in the mix
  hat: [0.2, 0.05, 2600, 0, 0.006, 0.03, 4, 0, 0, 0, 0, 0, 0, 2, 0, 0.1, 0, 0.6, 0.01, 0, 2400],
  hatOpen: [0.18, 0.05, 2600, 0, 0.02, 0.11, 4, 0, 0, 0, 0, 0, 0, 2, 0, 0.1, 0, 0.5, 0.03, 0, 2400],
  bass: [0.9, 0, 55, 0.01, 0.22, 0.12, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.04],
} satisfies Record<string, number[]>;
type Voice = keyof typeof SAMPLES;

interface Pattern {
  bpm: number;
  /** Fraction of a 16th that odd 16ths are delayed by. */
  swing: number;
  kick: string;
  snare: string;
  hat: string;
  hatOpen: string;
  /** [step, semitones from A1, length in steps] */
  bass: [number, number, number][];
}

// 32 steps = two bars of 16ths. x = full hit, o = soft hit, . = rest.
const PATTERNS: Record<Track, Pattern> = {
  title: {
    bpm: 92,
    swing: 0.08,
    kick: 'x.........x.....x.......x.x.....',
    snare: '....x.......x.......x.......x...',
    hat: 'x.o.x.o.x.o.x.o.x.o.x.o.x.o.x.o.',
    hatOpen: '..............x...............x.',
    bass: [[0, 0, 3], [6, 7, 2], [8, 5, 2], [11, 3, 2], [14, 0, 1], [16, 0, 3], [22, -2, 2], [24, -2, 2], [27, 3, 1], [29, 5, 1], [30, 7, 2]],
  },
  game: {
    bpm: 92,
    swing: 0.14,
    kick: 'x..x..x...x.x...x..x..x...x...x.',
    snare: '....x.......x.......x.......x..o',
    hat: 'xoxoxoxoxoxoxoxoxoxoxoxoxoxoxoxo',
    hatOpen: '......x.......x.......x.......x.',
    bass: [[0, 0, 2], [3, 0, 1], [6, 7, 2], [8, 5, 2], [11, 3, 2], [14, 0, 1], [16, 0, 2], [19, 0, 1], [22, -2, 2], [24, -2, 2], [27, 3, 1], [29, 5, 1], [30, 7, 2]],
  },
  boss: {
    bpm: 100,
    swing: 0.05,
    kick: 'x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.xx',
    snare: '....x.......x.......x.......x.xx',
    hat: 'xoxoxoxoxoxoxoxoxoxoxoxoxoxoxoxo',
    hatOpen: '......x.......x.......x.......x.',
    bass: [[0, 0, 2], [2, 0, 1], [4, 0, 2], [6, 0, 1], [8, 3, 2], [10, 3, 1], [12, 5, 2], [14, 6, 2], [16, 0, 2], [18, 0, 1], [20, 0, 2], [22, 0, 1], [24, -2, 2], [26, -2, 1], [28, -4, 2], [30, -5, 2]],
  },
};

const STEPS = 32;
const TICK_MS = 100;
const LOOKAHEAD_S = 0.25;
const MASTER = 0.45;

class MusicSystem {
  private buffers: Partial<Record<Voice, AudioBuffer>> = {};
  private master: GainNode | null = null;
  private wanted: Track | null = null;
  private current: Track | null = null;
  private step = 0;
  private nextTime = 0;
  private volume = 0.5;
  private ducked = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private switching = false;

  private get ctx(): AudioContext {
    return ZZFX.audioContext;
  }

  private ensure() {
    if (this.master) return;
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    for (const k of Object.keys(SAMPLES) as Voice[]) {
      const samples = ZZFX.buildSamples(...SAMPLES[k]);
      const buf = ctx.createBuffer(1, samples.length, ZZFX.sampleRate);
      buf.copyToChannel(Float32Array.from(samples), 0);
      this.buffers[k] = buf;
    }
    if (!this.timer) this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private target(): number {
    return this.wanted && this.volume > 0 ? MASTER * this.volume * (this.ducked ? 0.2 : 1) : 0;
  }

  private ramp(seconds: number) {
    if (!this.master) return;
    const g = this.master.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setTargetAtTime(this.target(), this.ctx.currentTime, seconds / 3);
  }

  /** Switch to a pattern. Idempotent; crossfades through the master gain. */
  play(name: Track) {
    this.ensure();
    this.ducked = false;
    if (this.wanted === name) {
      this.ramp(0.3);
      return;
    }
    this.wanted = name;
    if (this.current && !this.switching) {
      this.switching = true;
      if (this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
      setTimeout(() => {
        this.switching = false;
        this.current = null;
        this.ramp(0.5);
      }, 420);
    } else {
      this.ramp(0.5);
    }
  }

  stop() {
    this.wanted = null;
    this.current = null;
    this.ducked = false;
    this.ramp(0.4);
  }

  /** Pause menu: pull the beat down without stopping it. */
  duck(on: boolean) {
    this.ducked = on;
    this.ramp(0.3);
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master) this.ramp(0.2);
  }

  getVolume() {
    return this.volume;
  }

  private tick() {
    if (!this.wanted || this.switching || this.volume <= 0 || this.ctx.state !== 'running') {
      this.current = null;
      return;
    }
    const now = this.ctx.currentTime;
    if (this.current !== this.wanted) {
      this.current = this.wanted;
      this.step = 0;
      this.nextTime = now + 0.05;
    }
    const p = PATTERNS[this.current];
    const stepLen = 60 / p.bpm / 4;
    while (this.nextTime < now + LOOKAHEAD_S) {
      const swing = this.step % 2 === 1 ? p.swing * stepLen : 0;
      this.scheduleStep(p, this.step, this.nextTime + swing, stepLen);
      this.step = (this.step + 1) % STEPS;
      this.nextTime += stepLen;
    }
  }

  private hit(voice: Voice, at: number, gain: number, rate = 1) {
    if (!this.master) return;
    const buf = this.buffers[voice];
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(this.master);
    src.start(at);
  }

  private scheduleStep(p: Pattern, step: number, at: number, stepLen: number) {
    const vel = (s: string) => (s[step] === 'x' ? 1 : s[step] === 'o' ? 0.45 : 0);
    const k = vel(p.kick);
    const s = vel(p.snare);
    const h = vel(p.hat);
    const o = vel(p.hatOpen);
    if (k) this.hit('kick', at, k);
    if (s) this.hit('snare', at, s);
    if (o) this.hit('hatOpen', at, o * 0.5);
    else if (h) this.hit('hat', at, h * 0.4);
    for (const [bs, semi, len] of p.bass) {
      if (bs !== step) continue;
      const rate = Math.pow(2, semi / 12);
      this.hit('bass', at, 0.9, rate);
      void len; // the sample's own envelope sets the note length
      void stepLen;
    }
  }
}

export const Music = new MusicSystem();

// Keep the SFX unlock and the music start on the same gesture path.
export function unlockAudio() {
  Audio.unlock();
}
