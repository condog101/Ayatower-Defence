/**
 * The score. Pure data (plus a couple of string helpers), safe to import in tests.
 * Notation: see notation.ts. One step = one 16th note; `bpm` counts quarter notes.
 * All pieces are original. Everything is in D so the stingers sit on top of the loops.
 */
import { inKey } from './notation';

export type VoiceName =
  | 'flute'
  | 'harp'
  | 'horn'
  | 'strings'
  | 'choir'
  | 'bass'
  | 'bell'
  | 'frame'
  | 'taiko'
  | 'kick'
  | 'shaker';

/** Unpitched voices: the note's pitch only picks a variant (low = dum / big, high = tek / rim). */
export const PERCUSSION: readonly VoiceName[] = ['frame', 'taiko', 'kick', 'shaker'];

export interface Key {
  root: string;
  mode: string;
}

export interface SongTrack {
  voice: VoiceName;
  /** Track gain. The sum over a song stays <= MAX_SONG_VOL so stacked peaks don't clip. */
  vol: number;
  /** Stereo position, -1..1. */
  pan?: number;
  notes: string;
  /** Overrides the song key for this track (and for the in-mode test). */
  mode?: Key;
}

export interface Song {
  title: string;
  bpm: number;
  stepsPerBar: number;
  bars: number;
  loop: boolean;
  key: Key;
  tracks: SongTrack[];
}

export const MAX_SONG_VOL = 0.8;

const join = (...bars: string[]) => bars.join(' | ');
const rep = (bar: string, n: number) => join(...Array<string>(n).fill(bar));
/** Arpeggio: scale-degree offsets from a chord root degree, each note `len` steps. */
const arp = (key: Key, rootDeg: number, offsets: number[], octave: number, len: number) =>
  inKey(key.root, key.mode, offsets.map((o) => rootDeg + o), octave)
    .map((n) => `${n}/${len}`)
    .join(' ');

// ---------------------------------------------------------------------------------------------
// TITLE: "The Havens of Jask". D Dorian, 6/8 (12 steps a bar), 16 bars: A (1-4) A' (5-8) B (9-12) A'' (13-16).
// Chords: Dm G Dm Am | Dm G C Dm | F C G Am | Dm G C Dm. The raised 6th (B natural, over G) is the Dorian colour.
// ---------------------------------------------------------------------------------------------
const DORIAN: Key = { root: 'D', mode: 'dorian' };
// 6/8 harp roll: root, 5th, octave, 10th, octave, 5th in eighths. Degrees: 1 Dm, -3 G, 0 C, -2 Am, 3 F.
const roll68 = (deg: number) => arp(DORIAN, deg, [0, 4, 7, 9, 7, 4], 3, 2);
const TITLE_CHORDS = [1, -3, 1, -2, 1, -3, 0, 1, 3, 0, -3, -2, 1, -3, 0, 1];

const title: Song = {
  title: 'The Havens of Jask',
  bpm: 92,
  stepsPerBar: 12,
  bars: 16,
  loop: true,
  key: DORIAN,
  tracks: [
    {
      voice: 'flute',
      vol: 0.22,
      pan: 0.1,
      notes: join(
        // A: rise to A, fall through the B natural, half cadence on E (over Am)
        'D5/4 E5/2 F5/4 A5/2', 'G5/4 F5/2 E5/2 D5/2 B4/2', 'C5/2 D5/4 F5/2 E5/4', 'E5/9 ./3',
        // A': same opening, reaches up to B5, modal cadence C -> Dm
        'D5/4 E5/2 F5/4 A5/2', 'B5/4 A5/2 G5/4 F5/2', 'G5/4 E5/2 C5/4 E5/2', 'D5/9 ./3',
        // B: rising arpeggio sequence (F, then G), half cadence on A
        'C5/2 F5/2 A5/2 C6/6', 'B5/2 C6/2 B5/2 G5/4 E5/2', 'D5/2 G5/2 B5/2 D6/4 B5/2', 'B5/2 A5/2 G5/2 A5/6',
        // A'': scalar variant of the opening, full cadence, pickup A4 back into bar 1
        'D5/2 E5/2 F5/2 G5/2 A5/4', 'G5/4 F5/2 E5/2 D5/2 B4/2', 'C5/2 D5/2 E5/2 G5/4 E5/2', 'D5/8 ./2 A4/2',
      ),
    },
    { voice: 'harp', vol: 0.15, pan: -0.25, notes: join(...TITLE_CHORDS.map(roll68)) },
    // the drone: open D, re-bowed every four bars
    { voice: 'strings', vol: 0.12, notes: rep('D3/48', 4) },
    {
      // second strings voice enters at A': one sustained chord tone per bar under the tune
      voice: 'strings',
      vol: 0.08,
      pan: 0.3,
      notes: join('./48', 'F4/12', 'D4/12', 'E4/12', 'F4/12', 'A4/12', 'G4/12', 'G4/12', 'E4/12', 'F4/12', 'D4/12', 'E4/12', 'F4/12'),
    },
    {
      voice: 'bell',
      vol: 0.08,
      pan: -0.1,
      notes: join('A5/24', 'F5/24', 'A5/24', 'G5/24', 'A5/24', 'B5/24', 'A5/24', 'E5/24'),
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// BUILD: between waves. D Hijaz (Phrygian dominant), 4/4, 8 bars. No lead: a rolling santur-like
// harp, a drone and a sparse frame drum. Chords: D Eb D Cm | Gm Eb D(turn) D.
// ---------------------------------------------------------------------------------------------
const HIJAZ: Key = { root: 'D', mode: 'hijaz' };
// root, 5th, octave, 10th, 12th, 10th, octave, 5th. Degrees: 1 D, 2 Eb, 0 Cm, -3 Gm.
const roll44 = (deg: number) => arp(HIJAZ, deg, [0, 4, 7, 9, 11, 9, 7, 4], 3, 2);

const build: Song = {
  title: 'Night Watch on the Strait',
  bpm: 80,
  stepsPerBar: 16,
  bars: 8,
  loop: true,
  key: HIJAZ,
  tracks: [
    {
      voice: 'harp',
      vol: 0.15,
      pan: -0.2,
      notes: join(
        roll44(1), roll44(2), roll44(1), roll44(0), roll44(-3), roll44(2),
        // the Hijaz turn down onto the tonic, then let it ring
        'D3/2 A3/2 D4/2 F#4/2 G4/2 F#4/2 Eb4/2 C4/2', 'D4/2 A3/2 F#3/2 A3/2 D3/8',
      ),
    },
    {
      // high harp echoes: a falling Hijaz tetrachord at the ends of the two phrases
      voice: 'harp',
      vol: 0.07,
      pan: 0.35,
      notes: join('./16', './16', './16', './8 G5/2 F#5/2 Eb5/2 D5/2', './16', './16', './16', './8 C6/2 Bb5/2 A5/2 G5/2'),
    },
    { voice: 'strings', vol: 0.11, notes: rep('D3/64', 2) },
    {
      // dum on 1, tek on the "and" of 2, dum on 3; a ghost tek every other bar
      voice: 'frame',
      vol: 0.13,
      pan: 0.1,
      notes: rep('C3/6 C5/2 C3/8 | C3/6 C5/2 C3/6 C5?/2', 4),
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// WAVE: the battle march. D Dorian over a horn ostinato in G Hijaz (D F G Ab: the Hijaz turn on G),
// 4/4 at 112, 16 bars: intro (1-2) A (3-8) B on G (9-12, ends in a descending D-Eb-F-G-Ab-B-C run) A' (13-16).
// The flute counter-line avoids A natural wherever the horn sits on Ab.
// ---------------------------------------------------------------------------------------------
const G_HIJAZ: Key = { root: 'G', mode: 'hijaz' };
const OST_A = 'D3/3 D3/1 F3/2 G3/2 Ab3/3 G3/1 F3/2 G3/2';
const OST_B = 'D3/3 D3/1 F3/2 G3/2 C4/2 Ab3/2 G3/2 F3/2';
const BASS_D = 'D2/3 D2/1 D3/2 D2/2 D2/3 D2/1 D3/2 A2/2';
const BASS_G = 'G2/3 G2/1 G3/2 G2/2 G2/3 G2/1 G3/2 D3/2';
const MAQSUM = 'C3!/2 C5/4 C5/2 C3/4 C5/2 C5?/1 C5?/1';
const TAIKO_BAR = 'D2!/8 D2/8';
const TAIKO_FILL = 'D2!/8 D2/4 D2/2 D5/1 D5/1';

const wave: Song = {
  title: 'March on the Strait',
  bpm: 112,
  stepsPerBar: 16,
  bars: 16,
  loop: true,
  key: DORIAN,
  tracks: [
    {
      voice: 'horn',
      vol: 0.15,
      pan: -0.15,
      mode: G_HIJAZ,
      notes: join(
        OST_A, OST_B, OST_A, OST_B, OST_A, OST_B, OST_A, OST_B,
        // B: the tetrachord moved onto G (G Ab B C), then the long run home to D
        'G3/3 G3/1 Ab3/2 B3/2 C4/3 B3/1 Ab3/2 G3/2', 'G3/3 G3/1 B3/2 C4/2 D4/3 C4/1 B3/2 Ab3/2',
        OST_A, 'C4/2 B3/2 Ab3/2 G3/2 F3/2 Eb3/2 D3/4',
        OST_A, OST_B, OST_A, 'D3/4 . D3/1 F3/2 G3/2 Ab3/2 G3/2 F3/2',
      ),
    },
    {
      voice: 'flute',
      vol: 0.16,
      pan: 0.2,
      notes: join(
        './16', './16',
        // A: falling motif, sequenced up a 4th, cadence E -> D
        'A5/6 G5/2 F5/8', 'E5/2 F5/2 G5/4 F5/8',
        'C6/6 B5/2 C6/4 D6/4', 'C6/2 B5/2 G5/4 C6/4 A5/4',
        'G5/4 F5/4 D5/4 F5/4', 'E5/4 D5/12',
        // B: high and held over the G section, then a flourish shadowing the horn's run
        'D6/8 B5/4 C6/4', 'D6/4 C6/4 B5/8',
        'A5/6 B5/2 C6/8', 'D6/2 C6/2 B5/4 ./8',
        // A': busier answer, cadence G F E D
        'A5/4 D6/4 C6/4 A5/4', 'G5/2 A5/2 B5/4 C6/4 D6/4',
        'D6/6 C6/2 D6/3 C6/1 A5/4', 'G5/4 F5/4 E5/4 D5/4',
      ),
    },
    {
      voice: 'bass',
      vol: 0.17,
      notes: join(rep(BASS_D, 8), BASS_G, BASS_G, BASS_D, BASS_D, rep(BASS_D, 4)),
    },
    {
      voice: 'frame',
      vol: 0.11,
      pan: 0.25,
      notes: join(rep(MAQSUM, 15), 'C3!/2 C5/2 C5/2 C5/2 C3/2 C5/2 C6/2 C6/2'),
    },
    {
      voice: 'taiko',
      vol: 0.12,
      pan: -0.1,
      notes: rep(join(TAIKO_BAR, TAIKO_BAR, TAIKO_BAR, TAIKO_FILL), 4),
    },
    {
      voice: 'shaker',
      vol: 0.04,
      pan: 0.4,
      notes: join(rep('./16', 2), rep('C5/2 C5?/2 C5/2 C5?/2 C5/2 C5?/2 C5/2 C5?/2', 14)),
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// BOSS: the Eye arrives. D Locrian, 4/4 at 100, 16 bars. A low horn hammers the D-Ab tritone
// under a choir that sighs in semitones; bell tolls every two bars; taiko on 1 and 3, frame drum
// joins for B. Chords (2 bars each): D° Eb D° Ab-Eb | Gm Ab Fm Eb (the bII leads back to D°).
// ---------------------------------------------------------------------------------------------
const LOCRIAN: Key = { root: 'D', mode: 'locrian' };
const DOOM_A = 'D3/2 D3/2 Ab2/4 D3/2 D3/2 Ab2/2 Eb3/2';
const DOOM_B = 'D3/2 D3/2 Ab2/4 D3/2 D3/2 Bb2/2 Ab2/2';
const DOOM_C = 'D3/1 D3/1 D3/2 Ab2/2 D3/1 D3/1 D3/2 Ab2/2 Eb3/2 D3/2';

const boss: Song = {
  title: 'The Eye Over Hormuz',
  bpm: 100,
  stepsPerBar: 16,
  bars: 16,
  loop: true,
  key: LOCRIAN,
  tracks: [
    {
      voice: 'horn',
      vol: 0.17,
      pan: -0.1,
      notes: join(rep(join(DOOM_A, DOOM_B), 4), rep(join(DOOM_C, DOOM_B), 3), DOOM_C, 'Ab2/4 Eb3/4 D3/4 Ab2/4'),
    },
    {
      voice: 'choir',
      vol: 0.1,
      pan: 0.2,
      notes: join('Ab4/32', 'Bb4/32', 'Ab4/32', 'C5/16', 'Bb4/16', 'Bb4/32', 'C5/32', 'C5/16 Ab4/16', 'G4/16 Bb4/16'),
    },
    {
      voice: 'choir',
      vol: 0.08,
      pan: -0.25,
      notes: join('F4/32', 'G4/32', 'F4/32', 'Eb4/16', 'Eb4/16', 'D4/32', 'Eb4/32', 'F4/32', 'Eb4/32'),
    },
    {
      voice: 'bell',
      vol: 0.09,
      notes: join('D4/32', 'D4/32', 'D4/32', 'Ab4/16', 'Eb4/16', 'G4/32', 'Ab4/32', 'F4/32', 'Eb4/16 D4/16'),
    },
    {
      voice: 'taiko',
      vol: 0.17,
      notes: rep(join('D2!/8 D2/8', 'D2!/8 D2/8', 'D2!/8 D2/8', 'D2!/8 D2/4 D2/2 D5/1 D5/1'), 4),
    },
    {
      voice: 'frame',
      vol: 0.09,
      pan: 0.3,
      notes: join('./128', rep('C3/2 C5?/1 C5?/1 C5/2 C5?/1 C5?/1 C3/2 C5?/1 C5?/1 C6/2 C5?/1 C5?/1', 8)),
    },
  ],
};

// ---------------------------------------------------------------------------------------------
// CLEAR: fanfare, D major, 4 bars, plays once. Two horns in thirds/sixths, a plagal-dominant
// turn (Bm A G A) and the leading tone C#5 resolving to D5; the bell answers with a rising chime.
// ---------------------------------------------------------------------------------------------
const MAJOR: Key = { root: 'D', mode: 'ionian' };

const clear: Song = {
  title: 'The Strait Holds',
  bpm: 120,
  stepsPerBar: 16,
  bars: 4,
  loop: false,
  key: MAJOR,
  tracks: [
    {
      voice: 'horn',
      vol: 0.19,
      pan: 0.15,
      notes: join('A3/3 A3/1 D4/4 F#4/3 E4/1 F#4/4', 'A4/6 G4/2 F#4/4 E4/4', 'D4/3 E4/1 F#4/4 G4/2 B4/2 C#5/4', 'D5!/16'),
    },
    {
      voice: 'horn',
      vol: 0.14,
      pan: -0.15,
      notes: join('F#3/3 F#3/1 A3/4 D4/3 C#4/1 D4/4', 'F#4/6 E4/2 D4/4 C#4/4', 'B3/3 C#4/1 D4/4 E4/2 G4/2 A4/4', 'F#4/16'),
    },
    { voice: 'bass', vol: 0.15, notes: join('D3/16', 'D3/8 A2/8', 'B2/4 A2/4 G2/4 A2/4', 'D2/16') },
    { voice: 'bell', vol: 0.1, pan: 0.3, notes: join('D5/16', 'A5/16', 'B5/8 G5/4 A5/4', 'D5/4 F#5/4 A5/4 D6/4') },
    { voice: 'taiko', vol: 0.11, notes: join('D2!/16', 'D2/16', 'D2/8 D2/4 D2/2 D2?/1 D2/1', 'D2!/16') },
  ],
};

// ---------------------------------------------------------------------------------------------
// DEFEAT: dirge, D Aeolian, 4 bars at 72, plays once. A falling lament D5 -> D4 over
// i | VI iv | iv v | i, three string voices and one low bell.
// ---------------------------------------------------------------------------------------------
const AEOLIAN: Key = { root: 'D', mode: 'aeolian' };

const defeat: Song = {
  title: 'The Strait Falls',
  bpm: 72,
  stepsPerBar: 16,
  bars: 4,
  loop: false,
  key: AEOLIAN,
  tracks: [
    { voice: 'strings', vol: 0.2, pan: 0.15, notes: join('D5/8 C5/4 A4/4', 'Bb4/8 A4/4 G4/4', 'G4/4 F4/4 E4/8', 'D4/16') },
    { voice: 'strings', vol: 0.15, pan: -0.2, notes: join('F4/12 E4/4', 'D4/16', 'Bb3/8 C4/8', 'A3/16') },
    { voice: 'strings', vol: 0.15, notes: join('D3/16', 'Bb2/8 G2/8', 'G2/8 A2/8', 'D2/16') },
    { voice: 'bell', vol: 0.08, notes: join('D4/16', './16', './16', 'D4/16') },
  ],
};

export const SONGS = { title, build, wave, boss, clear, defeat } satisfies Record<string, Song>;
export type SongName = keyof typeof SONGS;
