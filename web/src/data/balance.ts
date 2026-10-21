// Phaser-side layout numbers. Gameplay numbers live in the Phaser-free sim (web/src/sim) and the data
// tables (towers.ts, enemies.ts, levels.ts); nothing under sim/ or data/ may import this file, because
// Device.ts reads `location` at import and the sim is tested headless in workerd.

import { MAP_H, MAP_W } from '../sim/const';
import { TOUCH } from '../systems/Device';

export const HEIGHT = 540;

/**
 * Canvas width. Desktop is 960x540 (16:9). Phones are wider than 16:9, so on touch the canvas
 * widens to the screen's landscape aspect (inside the safe area) instead of letterboxing.
 */
function gameWidth(): number {
  if (!TOUCH || typeof document === 'undefined') return 960;
  const el = document.getElementById('game');
  if (!el) return 960;
  const w = el.clientWidth;
  const h = el.clientHeight;
  if (!(w > 0 && h > 0)) return 960;
  // Long side over short side: a phone held in portrait at load still sizes for landscape play.
  const aspect = Math.max(w, h) / Math.min(w, h);
  return Math.min(1280, Math.max(960, Math.round((HEIGHT * aspect) / 2) * 2));
}

export const WIDTH = gameWidth();
/** How far a 960-wide layout shifts right to sit centred on the canvas. */
export const OX = (WIDTH - 960) / 2;
/** Every sprite is drawn at this integer scale. */
export const PX = 2;

/** HUD strip along the top. */
export const HUD_H = 28;
/** The 800x512 map sits under the HUD strip, left of the shop. */
export const MAP_X = OX;
export const MAP_Y = HUD_H;
export { MAP_H, MAP_W };
/** Shop sidebar, right of the map. */
export const SIDE_X = OX + MAP_W;
export const SIDE_W = 160;

/** Touch targets get this much slop on every side so every control is at least 44 px. */
export const SLOP = 8;

export const POPUP = {
  minGapMs: 30_000,
  maxGapMs: 55_000,
  typeMs: 3600,
  holdMs: 2600,
  contextCooldownMs: 9_000,
};

export const DEPTH = {
  water: 0,
  ground: 10,
  decor: 15,
  mines: 20,
  shadow: 25,
  sea: 30,
  towers: 35,
  projectiles: 45,
  air: 50,
  fx: 60,
  ghost: 70,
  hud: 100,
  popup: 200,
};
