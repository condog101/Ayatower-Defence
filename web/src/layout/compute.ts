// Screen layout, computed from the CSS viewport and safe-area insets. Pure (no DOM, no Phaser) so the
// layout tests run headless. The canvas always has exactly the screen's aspect (no pillar- or
// letter-boxing); the 800x512 map sits centred in the safe area with UI strips around it:
// top (HUD), bottom (ticker + hint), left (wave / speed / abilities), right (shop / tower panel).

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MAP_W = 800;
export const MAP_H = 512;
export const MIN_W = 1080;
export const MIN_H = 600;
const TOP = 36;
const BOTTOM = 52;
/** Menu scenes are designed in a 960x540 frame, centred in the safe area. */
export const DESIGN_W = 960;
export const DESIGN_H = 540;
export const TOWER_COUNT = 11;

export interface GameRects {
  start: Rect;
  speed: Rect;
  auto: Rect;
  pause: Rect;
  staff: Rect;
  fatwa: Rect;
  /** Shop cards, one per tower in order. */
  cards: Rect[];
  /** The right strip's content area (tower panel / placing panel). */
  side: Rect;
  /** Buttons stacked at the foot of the side area (upgrade / sell / target, or place / cancel). */
  sideButtons: Rect[];
  close: Rect;
}

export interface Layout {
  W: number;
  H: number;
  /** CSS px per logical px. */
  scale: number;
  touch: boolean;
  /** Extra hit area around every control. */
  slop: number;
  safe: Rect;
  map: Rect;
  top: Rect;
  bottom: Rect;
  left: Rect;
  right: Rect;
  /** Offset of the 960x540 design frame (menus). */
  ox: number;
  oy: number;
  game: GameRects;
}

const r = (x: number, y: number, w: number, h: number): Rect => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });

/** Lay out the canvas for a CSS viewport of cssW x cssH with the given safe-area insets (CSS px). */
export function computeLayout(cssW: number, cssH: number, insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 }, touch = false): Layout {
  // Measured in portrait (a phone held upright at load): lay out for landscape anyway.
  const w0 = Math.max(cssW, cssH);
  const h0 = Math.min(cssW, cssH);
  const aspect = w0 / h0;
  const W = Math.max(MIN_W, Math.round(MIN_H * aspect));
  const H = Math.max(MIN_H, Math.round(MIN_W / aspect));
  const scale = h0 / H;
  const ins = { top: insets.top / scale, right: insets.right / scale, bottom: insets.bottom / scale, left: insets.left / scale };
  const safe = r(ins.left, ins.top, W - ins.left - ins.right, H - ins.top - ins.bottom);

  const mapX = safe.x + Math.floor((safe.w - MAP_W) / 2);
  // The top strip needs TOP and the bottom BOTTOM; spare height is shared. The bottom strip may run
  // into a home-bar inset (it only holds text), never the map.
  const spare = Math.max(0, safe.h - TOP - BOTTOM - MAP_H);
  const mapY = Math.min(safe.y + TOP + Math.floor(spare / 2), H - BOTTOM - MAP_H);
  const map = r(mapX, mapY, MAP_W, MAP_H);
  const top = r(0, 0, W, mapY);
  const bottom = r(0, mapY + MAP_H, W, H - mapY - MAP_H);
  const left = r(safe.x, mapY, mapX - safe.x, MAP_H);
  const right = r(mapX + MAP_W, mapY, safe.x + safe.w - mapX - MAP_W, MAP_H);
  const ox = safe.x + Math.floor((safe.w - DESIGN_W) / 2);
  const oy = safe.y + Math.floor((safe.h - DESIGN_H) / 2);
  const slop = touch ? 6 : 0;
  return { W, H, scale, touch, slop, safe, map, top, bottom, left, right, ox, oy, game: gameRects(left, right, touch) };
}

function gameRects(left: Rect, right: Rect, touch: boolean): GameRects {
  const pad = 6;
  const gap = 12;
  // left strip: START, speed, AUTO, PAUSE, STAFF, FATWA
  const lw = left.w - 2 * pad;
  const small = touch ? 60 : 44;
  const big = touch ? 68 : 60;
  let y = left.y + 4;
  const row = (h: number) => {
    const rr = r(left.x + pad, y, lw, h);
    y += h + gap;
    return rr;
  };
  const start = row(big);
  const speed = row(small);
  const auto = row(small);
  const pause = row(small);
  const staff = row(big);
  const fatwa = row(big);

  // right strip: shop cards in two columns
  const cols = 2;
  const cgap = touch ? 12 : 6;
  const cw = (right.w - 2 * pad - (cols - 1) * cgap) / cols;
  const ch = touch ? 64 : 58;
  const cards: Rect[] = [];
  for (let i = 0; i < TOWER_COUNT; i++) {
    const c = i % cols;
    const rr = Math.floor(i / cols);
    cards.push(r(right.x + pad + c * (cw + cgap), right.y + 4 + rr * (ch + cgap), cw, ch));
  }
  const side = r(right.x + pad, right.y + 4, right.w - 2 * pad, right.h - 8);
  const bh = touch ? 60 : 44;
  const sideButtons: Rect[] = [];
  for (let i = 0; i < 3; i++) sideButtons.push(r(side.x, side.y + side.h - (3 - i) * (bh + gap) + gap, side.w, bh));
  const cs = touch ? 44 : 26;
  const close = r(side.x + side.w - cs, side.y, cs, cs);
  return { start, speed, auto, pause, staff, fatwa, cards, side, sideButtons, close };
}

export const grow = (a: Rect, d: number): Rect => ({ x: a.x - d, y: a.y - d, w: a.w + 2 * d, h: a.h + 2 * d });
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const inside = (a: Rect, b: Rect) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
