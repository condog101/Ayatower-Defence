import { describe, expect, it } from 'vitest';
import { LEVEL_ENEMY_COUNT, LEVEL_MAX_PLAY_SCORE, LEVEL_MIN_MS } from '../shared/scoring';
import { ENEMIES } from '../web/src/data/enemies';
import { LEVELS } from '../web/src/data/levels';
import { levelEnemyCount, levelMaxPlayScore, levelMinMs, schedule } from '../web/src/sim/waves';

describe('scoring tables match the levels', () => {
  const play = LEVELS.map((l) => levelMaxPlayScore(l, ENEMIES));
  const count = LEVELS.map((l) => levelEnemyCount(l, ENEMIES));
  const ms = LEVELS.map((l) => levelMinMs(l));
  const hint = () =>
    `\nPaste into shared/scoring.ts:\nLEVEL_MAX_PLAY_SCORE = [${play.join(', ')}]\nLEVEL_ENEMY_COUNT = [${count.join(', ')}]\nLEVEL_MIN_MS = [${ms.join(', ')}]\n`;

  it('LEVEL_MAX_PLAY_SCORE', () => {
    expect(LEVEL_MAX_PLAY_SCORE.slice(0, LEVELS.length), hint()).toEqual(play);
  });
  it('LEVEL_ENEMY_COUNT', () => {
    expect(LEVEL_ENEMY_COUNT.slice(0, LEVELS.length), hint()).toEqual(count);
  });
  it('LEVEL_MIN_MS', () => {
    expect(LEVEL_MIN_MS.slice(0, LEVELS.length), hint()).toEqual(ms);
  });
});

describe('schedule', () => {
  it('orders spawns by time, keeping group order on ties', () => {
    const s = schedule({ reward: 0, groups: [{ kind: 'rhib', n: 2, gap: 1, delay: 0 }, { kind: 'patrol', n: 2, gap: 1, delay: 0.5 }] });
    expect(s.map((x) => `${x.kind}@${x.at}`)).toEqual(['rhib@0', 'patrol@30', 'rhib@60', 'patrol@90']);
  });
});
