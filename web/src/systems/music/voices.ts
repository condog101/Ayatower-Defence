/**
 * Raw-oscillator instruments for the score. Each voice schedules a handful of short-lived nodes on
 * the AudioContext clock and stops them when the note's envelope has died away; `onended` then
 * disconnects the whole chain, so a long session doesn't accumulate nodes.
 * Peak output of a voice is roughly `vel` (0..1); the track gain scales it from there.
 */
import type { VoiceName } from './songs';

export type Voice = (ctx: BaseAudioContext, dest: AudioNode, freq: number, when: number, dur: number, vel: number) => void;

// --- shared resources (cached per context) ---------------------------------------------------

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();
const pulseCache = new WeakMap<BaseAudioContext, PeriodicWave>();

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let b = noiseCache.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, b);
  }
  return b;
}

/** 25% pulse, band-limited to 24 harmonics (the NES "harp" duty cycle). */
function pulse25(ctx: BaseAudioContext): PeriodicWave {
  let w = pulseCache.get(ctx);
  if (!w) {
    const n = 25;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    w = ctx.createPeriodicWave(real, imag);
    pulseCache.set(ctx, w);
  }
  return w;
}

// --- helpers ---------------------------------------------------------------------------------

/** Start a source, stop it at `end`, and tear the chain down once it has ended. */
function run(src: AudioScheduledSourceNode, when: number, end: number, chain: AudioNode[]) {
  src.onended = () => {
    src.disconnect();
    for (const n of chain) n.disconnect();
  };
  src.start(when);
  src.stop(end);
}

function osc(ctx: BaseAudioContext, type: OscillatorType, freq: number, detuneCents = 0): OscillatorNode {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detuneCents;
  return o;
}

/**
 * ADSR on a fresh gain node. Attack/decay are squeezed to fit short notes; the release starts at
 * the note's end. Returns the gain and the time by which the tail is silent.
 * Only explicit ramps (no chained setTargetAtTime), which behave the same in every engine.
 */
function adsr(ctx: BaseAudioContext, when: number, dur: number, peak: number, a: number, d: number, s: number, r: number) {
  const g = ctx.createGain();
  const p = g.gain;
  const att = Math.min(a, Math.max(0.005, dur * 0.6));
  const off = when + Math.max(dur, att);
  const dec = Math.min(d, off - (when + att));
  // level at note-off: sustain, or partway down the decay if the note ends during it
  const held = dec >= d ? peak * s : peak - (peak - peak * s) * (dec / d);
  p.setValueAtTime(0, when);
  p.linearRampToValueAtTime(peak, when + att);
  if (dec > 0) p.linearRampToValueAtTime(held, when + att + dec);
  p.setValueAtTime(held, off);
  p.linearRampToValueAtTime(0, off + r);
  return { g, end: off + r + 0.02 };
}

/** Percussive envelope: near-instant attack, exponential decay (-60 dB after 2 x `decay`). */
function hitEnv(ctx: BaseAudioContext, when: number, peak: number, decay: number) {
  const g = ctx.createGain();
  const top = Math.max(peak, 1e-4);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(top, when + 0.002);
  g.gain.exponentialRampToValueAtTime(top * 0.001, when + 0.002 + decay * 2);
  g.gain.setValueAtTime(0, when + 0.004 + decay * 2);
  return { g, end: when + decay * 2 + 0.02 };
}

function noise(ctx: BaseAudioContext): AudioBufferSourceNode {
  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer(ctx);
  n.loop = true;
  return n;
}

function filter(ctx: BaseAudioContext, type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** Sine with a downward pitch sweep (drum bodies). */
function body(ctx: BaseAudioContext, dest: AudioNode, when: number, from: number, to: number, sweep: number, peak: number, decay: number) {
  const o = osc(ctx, 'sine', from);
  o.frequency.setValueAtTime(from, when);
  o.frequency.exponentialRampToValueAtTime(to, when + sweep);
  const e = hitEnv(ctx, when, peak, decay);
  o.connect(e.g).connect(dest);
  run(o, when, e.end, [e.g]);
}

/** Filtered noise burst (drum skins, rims, shakers). */
function burst(ctx: BaseAudioContext, dest: AudioNode, when: number, type: BiquadFilterType, freq: number, q: number, peak: number, decay: number) {
  const n = noise(ctx);
  const f = filter(ctx, type, freq, q);
  const e = hitEnv(ctx, when, peak, decay);
  n.connect(f).connect(e.g).connect(dest);
  n.start(when, Math.random() * 0.5);
  n.stop(e.end);
  n.onended = () => {
    n.disconnect();
    f.disconnect();
    e.g.disconnect();
  };
}

// --- pitched voices ----------------------------------------------------------------------------

/** Triangle with a delayed ~5 Hz vibrato and a soft attack. */
const flute: Voice = (ctx, dest, freq, when, dur, vel) => {
  const o = osc(ctx, 'triangle', freq);
  const lfo = osc(ctx, 'sine', 5.2);
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(0, when);
  depth.gain.linearRampToValueAtTime(freq * 0.007, when + Math.min(0.35, dur));
  lfo.connect(depth).connect(o.frequency);
  const e = adsr(ctx, when, dur, vel, 0.05, 0.15, 0.8, 0.09);
  o.connect(e.g).connect(dest);
  run(o, when, e.end, [e.g]);
  run(lfo, when, e.end, [depth]);
};

/** 25% pulse, plucked: fast attack, a lowpass that closes, rings regardless of note length. */
const harp: Voice = (ctx, dest, freq, when, dur, vel) => {
  const o = ctx.createOscillator();
  o.setPeriodicWave(pulse25(ctx));
  o.frequency.value = freq;
  const f = filter(ctx, 'lowpass', Math.min(freq * 10, 9000), 0.9);
  f.frequency.setValueAtTime(Math.min(freq * 10, 9000), when);
  f.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 200), when + 0.35);
  const ring = Math.max(0.5, Math.min(1.4, dur + 0.3));
  const e = hitEnv(ctx, when, vel * 0.8, ring);
  o.connect(f).connect(e.g).connect(dest);
  run(o, when, e.end, [f, e.g]);
};

/** Square through a 1.2 kHz lowpass, slow attack, a slight scoop up into the pitch. */
const horn: Voice = (ctx, dest, freq, when, dur, vel) => {
  const o = osc(ctx, 'square', freq);
  o.frequency.setValueAtTime(freq * 0.985, when);
  o.frequency.exponentialRampToValueAtTime(freq, when + 0.06);
  const f = filter(ctx, 'lowpass', 1200, 0.8);
  const e = adsr(ctx, when, dur, vel * 0.7, 0.07, 0.2, 0.8, 0.12);
  o.connect(f).connect(e.g).connect(dest);
  run(o, when, e.end, [f, e.g]);
};

/** Two detuned saws through a lowpass, long attack and release. */
const strings: Voice = (ctx, dest, freq, when, dur, vel) => {
  const a = osc(ctx, 'sawtooth', freq, -7);
  const b = osc(ctx, 'sawtooth', freq, 7);
  const f = filter(ctx, 'lowpass', Math.min(freq * 5, 2600), 0.5);
  const e = adsr(ctx, when, dur, vel * 0.4, 0.3, 0.4, 0.85, 0.6);
  a.connect(f);
  b.connect(f);
  f.connect(e.g).connect(dest);
  run(a, when, e.end, [f, e.g]);
  run(b, when, e.end, []);
};

/** Triangle plus a sine an octave up, slow swell, gentle vibrato: a lo-fi "aah". */
const choir: Voice = (ctx, dest, freq, when, dur, vel) => {
  const t = osc(ctx, 'triangle', freq);
  const s = osc(ctx, 'sine', freq * 2);
  const sg = ctx.createGain();
  sg.gain.value = 0.35;
  const lfo = osc(ctx, 'sine', 4.6);
  const depth = ctx.createGain();
  depth.gain.value = freq * 0.004;
  lfo.connect(depth);
  depth.connect(t.frequency);
  depth.connect(s.frequency);
  const e = adsr(ctx, when, dur, vel * 0.75, 0.45, 0.5, 0.9, 0.7);
  t.connect(e.g);
  s.connect(sg).connect(e.g);
  e.g.connect(dest);
  run(t, when, e.end, [e.g]);
  run(s, when, e.end, [sg]);
  run(lfo, when, e.end, [depth]);
};

/** Triangle bass, short and round. */
const bass: Voice = (ctx, dest, freq, when, dur, vel) => {
  const o = osc(ctx, 'triangle', freq);
  const e = adsr(ctx, when, dur, vel, 0.008, 0.25, 0.7, 0.06);
  o.connect(e.g).connect(dest);
  run(o, when, e.end, [e.g]);
};

/** Sine plus inharmonic partials (2.76x, 5.40x) that decay faster: a small temple bell. */
const bell: Voice = (ctx, dest, freq, when, _dur, vel) => {
  const parts: [number, number, number][] = [
    [1, 0.6, 2.4],
    [2.76, 0.28, 0.9],
    [5.4, 0.12, 0.4],
  ];
  for (const [ratio, amp, decay] of parts) {
    const o = osc(ctx, 'sine', freq * ratio);
    const e = hitEnv(ctx, when, vel * amp, decay);
    o.connect(e.g).connect(dest);
    run(o, when, e.end, [e.g]);
  }
};

// --- percussion: pitch picks the variant ------------------------------------------------------

/** Frame drum / doumbek: below C4 a dum, C4-B5 a tek, C6 and up a sharp ka (slap). */
const frame: Voice = (ctx, dest, freq, when, _dur, vel) => {
  if (freq < 250) {
    body(ctx, dest, when, 150, 80, 0.08, vel * 0.9, 0.22);
    burst(ctx, dest, when, 'lowpass', 600, 0.7, vel * 0.25, 0.05);
  } else if (freq < 1000) {
    burst(ctx, dest, when, 'bandpass', 2600, 1.4, vel * 0.9, 0.06);
    body(ctx, dest, when, 520, 420, 0.03, vel * 0.25, 0.04);
  } else {
    burst(ctx, dest, when, 'bandpass', 3800, 1.8, vel * 0.9, 0.035);
  }
};

/** Taiko: low notes are the big drum, C5 and up a rim click. */
const taiko: Voice = (ctx, dest, freq, when, _dur, vel) => {
  if (freq < 250) {
    body(ctx, dest, when, 95, 48, 0.25, vel, 0.6);
    burst(ctx, dest, when, 'lowpass', 350, 0.7, vel * 0.45, 0.12);
  } else {
    burst(ctx, dest, when, 'bandpass', 1700, 2.5, vel * 0.7, 0.04);
    body(ctx, dest, when, 900, 700, 0.02, vel * 0.2, 0.03);
  }
};

/** Sine sweep 80 -> 40 Hz. */
const kick: Voice = (ctx, dest, _freq, when, _dur, vel) => {
  body(ctx, dest, when, 80, 40, 0.15, vel, 0.35);
};

/** High-passed noise; low notes give a longer shake. */
const shaker: Voice = (ctx, dest, freq, when, _dur, vel) => {
  burst(ctx, dest, when, 'highpass', 6500, 0.7, vel * 0.8, freq < 250 ? 0.12 : 0.05);
};

export const VOICES: Record<VoiceName, Voice> = { flute, harp, horn, strings, choir, bass, bell, frame, taiko, kick, shaker };

// --- FX bus ----------------------------------------------------------------------------------

/**
 * Shared send: dry + a 0.28 s feedback delay (darkened in the loop), all through a gentle 7 kHz
 * lowpass into `out`. Returns the input node tracks connect to.
 */
export function createFxBus(ctx: BaseAudioContext, out: AudioNode): AudioNode {
  const input = ctx.createGain();
  const tone = filter(ctx, 'lowpass', 7000, 0.5);
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.28;
  const fb = ctx.createGain();
  fb.gain.value = 0.25;
  const fbTone = filter(ctx, 'lowpass', 3000, 0.5);
  const wet = ctx.createGain();
  wet.gain.value = 0.25;
  input.connect(tone);
  input.connect(delay);
  delay.connect(fbTone).connect(fb).connect(delay);
  delay.connect(wet).connect(tone);
  tone.connect(out);
  return input;
}
