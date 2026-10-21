import { ZZFX } from 'zzfx';
import { Audio } from './Audio';
import { midiToFreq, parseTrack } from './music/notation';
import { SONGS, type SongName } from './music/songs';
import { VOICES, createFxBus, type Voice } from './music/voices';

/**
 * The score player. Songs (music/songs.ts) are multi-track note strings rendered live with raw
 * oscillator voices (music/voices.ts). A setInterval tick walks the current song's 16th steps and
 * schedules every note that starts on them ~0.25 s ahead on the AudioContext clock (the usual
 * two-clocks pattern). One master gain does the crossfades, the pause-menu duck and the volume.
 *
 * Tracks: title, build (calm between waves), wave (battle), boss, clear and defeat (stingers that
 * play once).
 */
export type Track = SongName;

interface Event {
  voice: Voice;
  track: number;
  freq: number;
  len: number;
  vel: number;
}

interface Prepared {
  steps: number;
  stepLen: number;
  loop: boolean;
  /** events[step] = notes starting on that step */
  events: Event[][];
  vols: number[];
  pans: number[];
}

const TICK_MS = 100;
const LOOKAHEAD_S = 0.25;
/** Rendered offline, the loudest song peaks around 0.37 at unity, so there is headroom to spare. */
const MASTER = 1;

function prepare(name: SongName): Prepared {
  const song = SONGS[name];
  const steps = song.bars * song.stepsPerBar;
  const events: Event[][] = Array.from({ length: steps }, () => []);
  song.tracks.forEach((t, track) => {
    const voice = VOICES[t.voice];
    for (const n of parseTrack(t.notes).notes) {
      if (n.step < steps) events[n.step].push({ voice, track, freq: midiToFreq(n.midi), len: n.len, vel: n.vel });
    }
  });
  return {
    steps,
    stepLen: 60 / song.bpm / 4,
    loop: song.loop,
    events,
    vols: song.tracks.map((t) => t.vol),
    pans: song.tracks.map((t) => t.pan ?? 0),
  };
}

class MusicSystem {
  private prepared = new Map<SongName, Prepared>();
  private master: GainNode | null = null;
  private fx: AudioNode | null = null;
  private wanted: SongName | null = null;
  private wantedOnce = false;
  private current: SongName | null = null;
  /** The current song was a one-shot and has played to its end. */
  private finished = false;
  /** Per-track gain nodes of the song now playing. */
  private buses: GainNode[] = [];
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
    this.fx = createFxBus(ctx, this.master);
    if (!this.timer) this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private song(name: SongName): Prepared {
    let p = this.prepared.get(name);
    if (!p) {
      p = prepare(name);
      this.prepared.set(name, p);
    }
    return p;
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

  /**
   * Switch songs. Idempotent for the song already playing; crossfades through the master gain.
   * `once` (and songs with loop: false) play to the end and then go silent; playing the same
   * stinger again after it has finished restarts it.
   */
  play(name: Track, opts: { once?: boolean } = {}) {
    const song: SongName = name;
    this.ensure();
    this.ducked = false;
    this.wantedOnce = !!opts.once || !SONGS[song].loop;
    if (this.wanted === song) {
      if (this.finished && this.current === song) this.current = null; // replay the stinger
      this.ramp(0.3);
      return;
    }
    this.wanted = song;
    if (this.switching) return; // the pending switch picks up the new song
    if (this.current && !this.finished) {
      this.switching = true;
      if (this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
      setTimeout(() => {
        this.switching = false;
        this.release();
        this.ramp(0.5);
      }, 420);
    } else {
      this.ramp(0.5);
    }
  }

  stop() {
    this.wanted = null;
    this.ducked = false;
    this.ramp(0.4);
  }

  /** Pause menu: pull the music down without stopping it. */
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

  /** Drop the current song: its buses fade out quickly and are disconnected (cutting any tails). */
  private release() {
    this.current = null;
    this.finished = false;
    if (!this.buses.length) return;
    const old = this.buses;
    this.buses = [];
    const now = this.ctx.currentTime;
    for (const g of old) {
      g.gain.cancelScheduledValues(now);
      g.gain.setTargetAtTime(0, now, 0.08);
    }
    setTimeout(() => {
      for (const g of old) g.disconnect();
    }, 700);
  }

  private makeBuses(p: Prepared): GainNode[] {
    const ctx = this.ctx;
    return p.vols.map((vol, i) => {
      const g = ctx.createGain();
      g.gain.value = vol;
      if (p.pans[i] && typeof ctx.createStereoPanner === 'function') {
        const pan = ctx.createStereoPanner();
        pan.pan.value = p.pans[i];
        g.connect(pan).connect(this.fx!);
      } else {
        g.connect(this.fx!);
      }
      return g;
    });
  }

  private tick() {
    if (!this.wanted || this.switching || this.volume <= 0 || this.ctx.state !== 'running') {
      if (this.current) this.release();
      return;
    }
    const now = this.ctx.currentTime;
    if (this.current !== this.wanted) {
      this.release();
      this.current = this.wanted;
      this.buses = this.makeBuses(this.song(this.current));
      this.step = 0;
      this.nextTime = now + 0.05;
    }
    if (this.finished) return;
    const p = this.song(this.current);
    // A throttled background tab can fall behind: skip ahead rather than fire a burst of late notes.
    if (this.nextTime < now - 0.2) this.nextTime = now + 0.05;
    const loop = p.loop && !this.wantedOnce;
    while (this.nextTime < now + LOOKAHEAD_S) {
      if (this.step >= p.steps) {
        if (!loop) {
          this.finished = true;
          return;
        }
        this.step = 0;
      }
      this.scheduleStep(p, this.step, this.nextTime);
      this.step++;
      this.nextTime += p.stepLen;
    }
  }

  private scheduleStep(p: Prepared, step: number, at: number) {
    for (const e of p.events[step]) {
      const bus = this.buses[e.track];
      if (bus) e.voice(this.ctx, bus, e.freq, at, e.len * p.stepLen, e.vel);
    }
  }
}

export const Music = new MusicSystem();

// Keep the SFX unlock and the music start on the same gesture path.
export function unlockAudio() {
  Audio.unlock();
}
