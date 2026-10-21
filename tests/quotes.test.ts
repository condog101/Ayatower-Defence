import { describe, expect, it } from 'vitest';
import { LEVEL_COUNT } from '../shared/progress';
import { TOWER_KEYS } from '../web/src/data/towers';
import { QUOTES, TWO_VOICE_TAGS, type QuoteTag } from '../web/src/data/quotes';
import { BEATS, ENDING, MISSIVES, type InputText } from '../web/src/data/story';

const TAGS: QuoteTag[] = [
  'start', 'waveStart', 'leak', 'lowLives', 'bossIntro', 'bossDead', 'clear', 'defeat', 'victory',
  'staff', 'fatwa', 'firstAir', 'firstArmoured', 'firstStealth', 'speed3', 'idle', 'random',
];

const inGame = [...QUOTES.map((q) => q.text), ...BEATS.flatMap((b) => [b.aya, b.don])];
const variants = (t: InputText) => (typeof t === 'string' ? [t] : [t.desktop, t.touch]);
const tweets = [...Object.values(MISSIVES).flat(), ...ENDING];
const allText = [...inGame, ...tweets.flatMap((t) => [...variants(t.text), t.reply?.text ?? '', t.seal ?? ''])];

describe('line bank', () => {
  it('every in-game line fits the phone card (150 chars)', () => {
    for (const line of inGame) expect(line.length, line).toBeLessThanOrEqual(150);
  });

  it('bleeped words are single tokens', () => {
    for (const line of allText) {
      for (const m of line.matchAll(/\{([^}]*)\}/g)) expect(m[1], line).not.toMatch(/\s/);
    }
  });

  it('never uses a raw asterisk (the typewriter reads * as a bleep)', () => {
    for (const line of allText) expect(line, line).not.toContain('*');
  });

  it('has at least three lines per tag', () => {
    for (const tag of TAGS) expect(QUOTES.filter((q) => q.tags.includes(tag)).length, tag).toBeGreaterThanOrEqual(3);
  });

  it('two-voice tags have both voices', () => {
    for (const tag of TWO_VOICE_TAGS) {
      for (const who of ['don', 'aya'] as const) {
        expect(QUOTES.filter((q) => q.tags.includes(tag) && q.who === who).length, `${tag} ${who}`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('has at least two lines for the first build of every tower', () => {
    for (const k of TOWER_KEYS) expect(QUOTES.filter((q) => q.tags.includes(`tower:${k}`)).length, k).toBeGreaterThanOrEqual(2);
  });

  it('teaching lines name the counter', () => {
    const say = (tag: QuoteTag) => QUOTES.filter((q) => q.tags.includes(tag)).map((q) => q.text.toUpperCase());
    for (const l of say('firstAir')) expect(l, l).toMatch(/AA|SAM/);
    for (const l of say('firstArmoured')) expect(l, l).toMatch(/BULLET|BOOM|EXPLOSIVE|ROCKET|MISSILE/);
    for (const l of say('firstStealth')) expect(l, l).toMatch(/RADAR|MINE/);
  });
});

describe('story', () => {
  it('has missives for every campaign level, and only those', () => {
    for (let n = 1; n <= LEVEL_COUNT; n++) expect(MISSIVES[n]?.length, `level ${n}`).toBeGreaterThan(0);
    for (const k of Object.keys(MISSIVES).map(Number)) {
      expect(k).toBeGreaterThanOrEqual(1);
      expect(k).toBeLessThanOrEqual(LEVEL_COUNT);
    }
  });

  it('level 1 opens with a three-card tutorial worded for both inputs', () => {
    const tut = MISSIVES[1].slice(0, 3);
    expect(tut).toHaveLength(3);
    expect(tut.filter((t) => typeof t.text !== 'string').length).toBeGreaterThanOrEqual(2);
  });

  it('missives and replies stay short', () => {
    for (const t of tweets) {
      for (const v of variants(t.text)) expect(v.length, v).toBeLessThanOrEqual(220);
      if (t.reply) expect(t.reply.text.length, t.reply.text).toBeLessThanOrEqual(120);
    }
  });

  it('beats land on real waves of real levels', () => {
    for (const b of BEATS) {
      expect(b.level).toBeGreaterThanOrEqual(1);
      expect(b.level).toBeLessThanOrEqual(LEVEL_COUNT);
      if (b.at === 'boss') expect([5, 10]).toContain(b.level);
      else expect(Number(b.at.split(':')[1])).toBeGreaterThan(0);
    }
  });
});
