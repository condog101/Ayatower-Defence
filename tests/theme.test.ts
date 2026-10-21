import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../web/src/data/enemies';
import { LEVELS } from '../web/src/data/levels';
import { QUOTES } from '../web/src/data/quotes';
import { BEATS, ENDING, MISSIVES, type InputText } from '../web/src/data/story';
import { TOWERS } from '../web/src/data/towers';

// Leftovers from the sibling game's hip-hop and social-media framing must not come back.
const BANNED = ['REPOSTS', 'LIKES', 'COMMUNITY NOTE', '@', 'CHARTS', 'CALLSIGN', 'GUARD', 'INCOMING', 'POSTED', '3 AM', 'FAKE NEWS'];

const variants = (t: InputText) => (typeof t === 'string' ? [t] : [t.desktop, t.touch]);

/** Every user-facing string in the data tables. */
const dataText: string[] = [
  ...QUOTES.map((q) => q.text),
  ...BEATS.flatMap((b) => [b.aya, b.don]),
  ...[...Object.values(MISSIVES).flat(), ...ENDING].flatMap((m) => [...variants(m.text), m.seal ?? '', m.reply?.text ?? '']),
  ...LEVELS.flatMap((l) => [l.name, l.sub, l.brief, l.bossName ?? '']),
  ...Object.values(TOWERS).flatMap((t) => [t.name, t.basis, t.pro, t.con, ...t.tiers.flatMap((x) => [x.name, x.blurb])]),
  ...Object.values(ENEMIES).flatMap((e) => [e.name, e.short]),
];

// String literals in the Phaser-side code (scenes, game UI, systems), where the on-screen copy lives.
const sources = import.meta.glob(['../web/src/scenes/*.ts', '../web/src/game/*.ts', '../web/src/systems/*.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const literals = Object.entries(sources).flatMap(([file, src]) =>
  [...src.matchAll(/'([^'\n]*)'|`([^`]*)`/g)].map((m) => ({ file, s: m[1] ?? m[2] ?? '' })),
);

describe('theme', () => {
  it('the data tables carry none of the old framing', () => {
    for (const s of dataText) {
      for (const w of BANNED) expect(s.toUpperCase().includes(w), `"${w}" in: ${s}`).toBe(false);
    }
  });

  it('on-screen copy in the code carries none of it either', () => {
    expect(literals.length).toBeGreaterThan(100);
    for (const { file, s } of literals) {
      // copy is written in capitals; lower-case literals are keys and selectors
      for (const w of BANNED) if (w !== '@') expect(s.includes(w), `"${w}" in ${file}: ${s}`).toBe(false);
    }
  });
});
