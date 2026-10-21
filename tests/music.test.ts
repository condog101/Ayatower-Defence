import { describe, expect, it } from 'vitest';
import { MODES, inKey, inMode, isMode, midiToFreq, noteToMidi, parseTrack } from '../web/src/systems/music/notation';
import { MAX_SONG_VOL, PERCUSSION, SONGS } from '../web/src/systems/music/songs';

describe('notation', () => {
  it('maps note names to MIDI and frequency', () => {
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('C#4')).toBe(61);
    expect(noteToMidi('Db4')).toBe(61);
    expect(noteToMidi('Bb3')).toBe(58);
    expect(noteToMidi('B#3')).toBe(60);
    expect(noteToMidi('D2')).toBe(38);
    expect(noteToMidi('C-1')).toBe(0);
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
    expect(midiToFreq(57)).toBeCloseTo(220, 6);
    expect(() => noteToMidi('H4')).toThrow();
  });

  it('parses lengths, octaves and accidentals', () => {
    const t = parseTrack('D4/2 F#4 Bb5/3');
    expect(t.notes).toEqual([
      { step: 0, len: 2, midi: 62, vel: 0.8 },
      { step: 2, len: 1, midi: 66, vel: 0.8 },
      { step: 3, len: 3, midi: 82, vel: 0.8 },
    ]);
    expect(t.steps).toBe(6);
  });

  it('parses rests', () => {
    const t = parseTrack('C4 . ./3 E4/2');
    expect(t.notes.map((n) => [n.step, n.len, n.midi])).toEqual([[0, 1, 60], [5, 2, 64]]);
    expect(t.steps).toBe(7);
  });

  it('ties extend the previous note, or the previous rest', () => {
    const t = parseTrack('A4/2 - -/3 B4 ./2 - C5');
    expect(t.notes.map((n) => [n.step, n.len, n.midi])).toEqual([[0, 6, 69], [6, 1, 71], [10, 1, 72]]);
    expect(t.steps).toBe(11);
  });

  it('ignores bar lines and extra whitespace', () => {
    expect(parseTrack('  C4/4 |  D4/4\n| E4/8 ')).toEqual(parseTrack('C4/4 D4/4 E4/8'));
  });

  it('reads accents and ghost notes', () => {
    const [a, g, n] = parseTrack('C3!/2 C5? C5').notes;
    expect(a.vel).toBe(1);
    expect(a.len).toBe(2);
    expect(g.vel).toBeLessThan(n.vel);
  });

  it('rejects malformed tokens', () => {
    for (const bad of ['C', 'X4', 'C4/0', 'C4/x', 'C##4', '..']) expect(() => parseTrack(bad), bad).toThrow();
  });

  it('builds notes from scale degrees', () => {
    expect(inKey('D', 'dorian', [1, 2, 3, 4, 5, 6, 7, 8], 4)).toEqual(['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5']);
    expect(inKey('D', 'hijaz', [1, 2, 3], 4)).toEqual(['D4', 'Eb4', 'F#4']);
    expect(inKey('D', 'dorian', [0, -3, 10], 3)).toEqual(['C3', 'G2', 'F4']);
  });

  it('checks mode membership', () => {
    expect(inMode(noteToMidi('B4'), 'D', 'dorian')).toBe(true);
    expect(inMode(noteToMidi('Bb4'), 'D', 'dorian')).toBe(false);
    expect(inMode(noteToMidi('Eb2'), 'D', 'phrygianDominant')).toBe(true);
    expect(inMode(noteToMidi('F#6'), 'D', 'hijaz')).toBe(true);
    expect(inMode(noteToMidi('F6'), 'D', 'hijaz')).toBe(false);
    expect(inMode(noteToMidi('Ab3'), 'D', 'locrian')).toBe(true);
    expect(MODES.hijaz).toEqual(MODES.phrygianDominant);
  });
});

describe('songs', () => {
  const entries = Object.entries(SONGS);

  it('has every track the game asks for', () => {
    expect(Object.keys(SONGS).sort()).toEqual(['boss', 'build', 'clear', 'defeat', 'title', 'wave']);
  });

  it('every song parses and every track fills the song exactly', () => {
    for (const [name, song] of entries) {
      const steps = song.bars * song.stepsPerBar;
      expect(isMode(song.key.mode), name).toBe(true);
      song.tracks.forEach((t, i) => {
        const parsed = parseTrack(t.notes);
        expect(parsed.steps, `${name} track ${i} (${t.voice})`).toBe(steps);
        expect(parsed.notes.length, `${name} track ${i} is empty`).toBeGreaterThan(0);
      });
    }
  });

  it('pitched notes stay inside the track mode (or the song key)', () => {
    for (const [name, song] of entries) {
      song.tracks.forEach((t, i) => {
        if (PERCUSSION.includes(t.voice)) return;
        const key = t.mode ?? song.key;
        expect(isMode(key.mode), `${name} track ${i} mode`).toBe(true);
        for (const n of parseTrack(t.notes).notes) {
          expect(inMode(n.midi, key.root, key.mode), `${name} track ${i} (${t.voice}) step ${n.step} midi ${n.midi} not in ${key.root} ${key.mode}`).toBe(true);
        }
      });
    }
  });

  it('pitched notes stay in a playable range', () => {
    for (const [name, song] of entries) {
      for (const t of song.tracks) {
        if (PERCUSSION.includes(t.voice)) continue;
        for (const n of parseTrack(t.notes).notes) {
          expect(n.midi, name).toBeGreaterThanOrEqual(noteToMidi('C2'));
          expect(n.midi, name).toBeLessThanOrEqual(noteToMidi('E6'));
        }
      }
    }
  });

  it('stingers do not loop, the rest do', () => {
    expect(SONGS.clear.loop).toBe(false);
    expect(SONGS.defeat.loop).toBe(false);
    for (const n of ['title', 'build', 'wave', 'boss'] as const) expect(SONGS[n].loop, n).toBe(true);
  });

  it('track volumes sum low enough not to clip', () => {
    for (const [name, song] of entries) {
      const sum = song.tracks.reduce((s, t) => s + t.vol, 0);
      expect(sum, name).toBeLessThanOrEqual(MAX_SONG_VOL);
      for (const t of song.tracks) {
        expect(t.vol, name).toBeGreaterThan(0);
        expect(Math.abs(t.pan ?? 0), name).toBeLessThanOrEqual(1);
      }
    }
  });

  it('matches the brief: tempos, metres and lengths', () => {
    expect(SONGS.title).toMatchObject({ bpm: 92, stepsPerBar: 12, bars: 16, key: { root: 'D', mode: 'dorian' } });
    expect(SONGS.build).toMatchObject({ bars: 8, key: { root: 'D', mode: 'hijaz' } });
    expect(SONGS.wave).toMatchObject({ bpm: 112, stepsPerBar: 16, bars: 16 });
    expect(SONGS.boss).toMatchObject({ bpm: 100, stepsPerBar: 16, bars: 16, key: { mode: 'locrian' } });
    expect(SONGS.clear).toMatchObject({ bars: 4, key: { root: 'D', mode: 'ionian' } });
    expect(SONGS.defeat).toMatchObject({ bars: 4, key: { root: 'D', mode: 'aeolian' } });
  });
});
