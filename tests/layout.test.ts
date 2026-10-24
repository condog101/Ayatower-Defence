import { describe, expect, it } from 'vitest';
import { computeLayout, grow, inside, overlaps, type Insets, type Rect } from '../web/src/layout/compute';

const none: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
const notch = (side: number, bottom = 21): Insets => ({ top: 0, right: side, bottom, left: side });

// [name, css width, css height, insets, touch]
const VIEWPORTS: [string, number, number, Insets, boolean][] = [
  ['iPhone SE', 667, 375, none, true],
  ['iPhone 12 mini', 812, 375, notch(44), true],
  ['iPhone 14', 844, 390, notch(47), true],
  ['iPhone 14 Pro', 852, 393, notch(59), true],
  ['iPhone 15 Pro Max', 932, 430, notch(59), true],
  ['Pixel 7', 915, 412, none, true],
  ['Pixel 8 (cutout)', 915, 412, { top: 0, right: 0, bottom: 0, left: 30 }, true],
  ['Galaxy S23', 780, 360, none, true],
  ['Galaxy S8', 740, 360, none, true],
  ['Z Fold cover', 882, 344, none, true],
  ['iPad 4:3', 1024, 768, none, true],
  ['Phone held portrait', 390, 844, none, true],
  ['1366x768', 1366, 768, none, false],
  ['1920x1080', 1920, 1080, none, false],
  ['2560x1080', 2560, 1080, none, false],
];

const controls = (l: ReturnType<typeof computeLayout>): [string, Rect][] => [
  ['start', l.game.start],
  ['speed', l.game.speed],
  ['auto', l.game.auto],
  ['pause', l.game.pause],
  ['staff', l.game.staff],
  ['fatwa', l.game.fatwa],
  ...l.game.cards.map((c, i): [string, Rect] => [`card${i}`, c]),
];

describe('layout', () => {
  for (const [name, w, h, insets, touch] of VIEWPORTS) {
    it(name, () => {
      const l = computeLayout(w, h, insets, touch);
      const aspect = Math.max(w, h) / Math.min(w, h);
      // the canvas has the screen's aspect: no bars
      expect(Math.abs(l.W - l.H * aspect), `${l.W}x${l.H}`).toBeLessThanOrEqual(1);
      expect(l.W).toBeGreaterThanOrEqual(1080);
      expect(l.H).toBeGreaterThanOrEqual(600);
      // the map is inside the safe area, the strips are usable
      expect(inside(l.map, l.safe), JSON.stringify([l.map, l.safe])).toBe(true);
      expect(l.left.w).toBeGreaterThanOrEqual(120);
      expect(l.right.w).toBeGreaterThanOrEqual(120);
      expect(l.top.h).toBeGreaterThanOrEqual(36);
      expect(l.bottom.h).toBeGreaterThanOrEqual(52);
      const cs = controls(l);
      for (const [n, c] of cs) {
        expect(inside(c, l.safe), `${n} inside safe`).toBe(true);
        expect(overlaps(c, l.map), `${n} off the map`).toBe(false);
        const hit = grow(c, l.slop);
        if (touch) expect(Math.min(hit.w, hit.h), `${n} hit size`).toBeGreaterThanOrEqual(68);
      }
      for (let i = 0; i < cs.length; i++) {
        for (let j = i + 1; j < cs.length; j++) {
          expect(overlaps(grow(cs[i][1], l.slop), grow(cs[j][1], l.slop)), `${cs[i][0]} vs ${cs[j][0]}`).toBe(false);
        }
      }
      expect(l.game.sideButtons).toHaveLength(4);
      for (const b of l.game.sideButtons) expect(inside(b, l.right)).toBe(true);
      for (let i = 1; i < l.game.sideButtons.length; i++) expect(overlaps(l.game.sideButtons[i - 1], l.game.sideButtons[i])).toBe(false);
      // the 960x540 menu frame fits
      expect(l.ox).toBeGreaterThanOrEqual(0);
      expect(l.oy).toBeGreaterThanOrEqual(0);
    });
  }
});
