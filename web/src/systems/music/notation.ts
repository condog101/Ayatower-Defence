/**
 * Tiny score notation for the music system. Pure: no DOM, no AudioContext, safe to import in tests.
 *
 * A track is a string of space-separated tokens, one step = one 16th note:
 *   D4      note (A-G, optional # or b, octave; C4 = MIDI 60), 1 step long
 *   F#5/3   note 3 steps long
 *   Bb3!/2  accented (velocity 1; the mark may also follow the length: Bb3/2!); Bb3? is a ghost
 *           note (velocity 0.45); default velocity 0.8
 *   .  ./4  rest (1 step / 4 steps)
 *   -  -/2  tie: extends the previous note (or rest) by 1 / 2 steps
 *   |       bar line, ignored (readability only)
 */

export interface Note {
  step: number;
  len: number;
  midi: number;
  vel: number;
}

export interface ParsedTrack {
  notes: Note[];
  /** Total length of the track in 16th steps. */
  steps: number;
}

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_RE = /^([A-G])([#b]?)(-?\d)$/;
const TOKEN_RE = /^([A-G][#b]?-?\d|\.|-)([!?]?)(?:\/(\d+))?([!?]?)$/;

export const VEL_DEFAULT = 0.8;
export const VEL_ACCENT = 1;
export const VEL_GHOST = 0.45;

/** 'A4' -> 69, 'C4' -> 60, 'Bb3' -> 58. Throws on anything else. */
export function noteToMidi(name: string): number {
  const m = NOTE_RE.exec(name);
  if (!m) throw new Error(`bad note name "${name}"`);
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + LETTER[m[1]] + acc;
}

export function midiToName(midi: number): string {
  return `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Pitch-class sets (semitones above the root). */
export const MODES = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  minor: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  /** Phrygian dominant: the flat 2nd and the augmented 2nd up to the major 3rd. */
  phrygianDominant: [0, 1, 4, 5, 7, 8, 10],
  hijaz: [0, 1, 4, 5, 7, 8, 10],
} as const satisfies Record<string, readonly number[]>;

export type ModeName = keyof typeof MODES;

export function isMode(name: string): name is ModeName {
  return Object.prototype.hasOwnProperty.call(MODES, name);
}

function modeSteps(mode: string): readonly number[] {
  if (!isMode(mode)) throw new Error(`unknown mode "${mode}"`);
  return MODES[mode];
}

function rootPc(root: string): number {
  // accept 'D' or 'D4'
  return noteToMidi(/\d$/.test(root) ? root : `${root}4`) % 12;
}

/** Is this MIDI note inside `mode` built on `root` ('D', 'Bb', ...)? */
export function inMode(midi: number, root: string, mode: string): boolean {
  const pc = (((midi - rootPc(root)) % 12) + 12) % 12;
  return modeSteps(mode).includes(pc);
}

/**
 * Scale degrees to note names. Degree 1 is `root` in `octave`; 8 is an octave up, 0 is the 7th
 * below, -3 the 4th below, and so on. inKey('D', 'dorian', [1, 3, 5, 8], 4) -> D4 F4 A4 D5.
 */
export function inKey(root: string, mode: string, degrees: number[], octave: number): string[] {
  const steps = modeSteps(mode);
  const base = noteToMidi(`${root}${octave}`);
  return degrees.map((d) => {
    const i = d - 1;
    const oct = Math.floor(i / steps.length);
    const idx = i - oct * steps.length;
    return midiToName(base + 12 * oct + steps[idx]);
  });
}

/** Parse one track. Throws on a malformed token so bad scores fail loudly in tests. */
export function parseTrack(src: string): ParsedTrack {
  const notes: Note[] = [];
  let step = 0;
  let last: Note | null = null; // the note a tie would extend (null after a rest)
  for (const tok of src.trim().split(/\s+/)) {
    if (tok === '' || tok === '|') continue;
    const m = TOKEN_RE.exec(tok);
    if (!m) throw new Error(`bad token "${tok}"`);
    const len = m[3] === undefined ? 1 : Number(m[3]);
    if (!(len > 0)) throw new Error(`bad length in "${tok}"`);
    const head = m[1];
    if (head === '.') {
      last = null;
    } else if (head === '-') {
      if (last) last.len += len;
    } else {
      const mark = m[2] || m[4];
      if (m[2] && m[4]) throw new Error(`two accent marks in "${tok}"`);
      const vel = mark === '!' ? VEL_ACCENT : mark === '?' ? VEL_GHOST : VEL_DEFAULT;
      last = { step, len, midi: noteToMidi(head), vel };
      notes.push(last);
    }
    step += len;
  }
  return { notes, steps: step };
}
