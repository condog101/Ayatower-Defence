// Fixed simulation constants. The sim runs on a fixed 60 Hz tick; every duration is in ticks and
// every speed is in px/s (multiplied by DT per tick). Map space is 800x512 with (0,0) at the map's
// top-left; the Phaser side adds the map's screen offset.

export const TICK_HZ = 60;
export const DT = 1 / TICK_HZ;
/** Seconds -> ticks. */
export const sec = (s: number): number => Math.round(s * TICK_HZ);

export const TILE = 32;
export const COLS = 25;
export const ROWS = 16;
export const MAP_W = COLS * TILE;
export const MAP_H = ROWS * TILE;

/** Enemy `speed` 1.0 is this many px/s along the lane. */
export const BASE_SPEED = 40;

/** Sell refund as a fraction of everything spent on the tower. */
export const SELL_RATE = 0.7;
