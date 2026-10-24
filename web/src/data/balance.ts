// Phaser-side layout numbers. Gameplay numbers live in the Phaser-free sim (web/src/sim) and the data
// tables (towers.ts, enemies.ts, levels.ts); nothing under sim/ or data/ may import this file, because
// Device.ts reads `location` at import and the sim is tested headless in workerd.
//
// The layout is recomputed when the screen changes (rotation, fullscreen, resize): these are live ES
// module bindings, so read them where they're used (create(), constructors), never copy them into
// module-level constants.

import { computeLayout, MAP_H, MAP_W, type Layout } from '../layout/compute';
import { TOUCH } from '../systems/Device';

export { MAP_H, MAP_W };

/** The current layout (systems/Layout.ts measures the screen and calls setLayout). */
export let L: Layout = computeLayout(1920, 1080, undefined, TOUCH);
export let WIDTH = L.W;
export let HEIGHT = L.H;
/** Where the 960x540 design frame of the menu scenes sits. */
export let OX = L.ox;
export let OY = L.oy;
/** Horizontal centre of the design frame. */
export let CX = L.ox + 480;
export let MAP_X = L.map.x;
export let MAP_Y = L.map.y;

export function setLayout(next: Layout) {
  L = next;
  WIDTH = next.W;
  HEIGHT = next.H;
  OX = next.ox;
  OY = next.oy;
  CX = next.ox + 480;
  MAP_X = next.map.x;
  MAP_Y = next.map.y;
}

/** Every sprite is drawn at this integer scale. */
export const PX = 2;

/** Tower and turret sheets are 32x32 drawn at 1x: twice the world's pixel density, so they stay legible small. */
export const TOWER_PX = 1;

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
