import { describe, expect, it } from 'vitest';
import { denseCells, Lane } from '../web/src/sim/path';

describe('lane', () => {
  it('fills straight and diagonal runs cell by cell', () => {
    expect(denseCells([[0, 0], [3, 0], [3, 2], [5, 4]])).toEqual([
      [0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [4, 3], [5, 4],
    ]);
    expect(() => denseCells([[0, 0], [3, 1]])).toThrow();
  });

  it('measures a straight lane exactly and interpolates positions', () => {
    const lane = new Lane([[-1, 5], [23, 5]]);
    expect(lane.length).toBeCloseTo(24 * 32, 5);
    expect(lane.posAt(0)).toEqual([-16, 176]);
    const [x, y] = lane.posAt(100);
    expect(x).toBeCloseTo(84, 5);
    expect(y).toBeCloseTo(176, 5);
    expect(lane.posAt(1e9)[0]).toBeCloseTo(23 * 32 + 16, 5);
    expect(lane.angleAt(50)).toBeCloseTo(0, 5);
    expect(lane.normalAt(50)[1]).toBeCloseTo(-1, 5);
  });

  it('rounds corners without leaving the corner cells', () => {
    const lane = new Lane([[0, 0], [4, 0], [4, 4]]);
    for (let d = 0; d <= lane.length; d += 2) {
      const [x, y] = lane.posAt(d);
      const c = Math.floor(x / 32);
      const r = Math.floor(y / 32);
      expect(r === 0 || c === 4, `${x},${y}`).toBe(true);
    }
    // close to the cell-centre path length
    expect(lane.length).toBeGreaterThan(7.5 * 32);
    expect(lane.length).toBeLessThan(8.2 * 32);
  });

  it('finds the nearest lane distance and spots in range', () => {
    const lane = new Lane([[-1, 5], [23, 5]]);
    expect(lane.nearestD(200, 100)).toBeCloseTo(216, -1);
    const spots = lane.spotsWithin(200, 140, 50);
    expect(spots.length).toBeGreaterThan(0);
    for (const d of spots) expect(Math.hypot(lane.posAt(d)[0] - 200, lane.posAt(d)[1] - 140)).toBeLessThanOrEqual(50);
  });
});
