import { COLS, ROWS, TILE } from './const';

/**
 * Map legend (one character per 32 px cell, 16 rows of 25):
 *   ~ deep water     = shipping lane (water; the lane polyline must stay on = or ~)
 *   , shallows (sea-tower placement: mines, martyr boats, Ghadir subs)
 *   . land (land-tower placement)      # rock (blocked)
 *   P palm  T village  M mosque (decor on land, blocked)
 *   O oil platform (decor on water, blocked)
 *   A the Ayatower (blocked)
 */
export type CellKind = 'water' | 'lane' | 'shallow' | 'land' | 'rock' | 'palm' | 'village' | 'mosque' | 'oil' | 'aya' | 'void';

export const LEGEND: Record<string, CellKind> = {
  '~': 'water',
  '=': 'lane',
  ',': 'shallow',
  '.': 'land',
  '#': 'rock',
  P: 'palm',
  T: 'village',
  M: 'mosque',
  O: 'oil',
  A: 'aya',
};

export type Grid = CellKind[][];

export function parseRows(rows: string[]): Grid {
  return rows.map((row) => [...row].map((ch) => LEGEND[ch] ?? 'void'));
}

export function cellKind(grid: Grid, c: number, r: number): CellKind {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 'void';
  return grid[r]?.[c] ?? 'void';
}

/** Water-like for shore auto-tiling and for where the lane may run. */
export function isWet(k: CellKind): boolean {
  return k === 'water' || k === 'lane' || k === 'shallow' || k === 'oil' || k === 'void';
}

/** Can a tower of this placement go here? Row 0 is never placeable (it sits under the HUD's hit slop). */
export function isPlaceable(grid: Grid, c: number, r: number, placement: 'land' | 'shallow'): boolean {
  if (r <= 0) return false;
  const k = cellKind(grid, c, r);
  return placement === 'land' ? k === 'land' : k === 'shallow';
}

export const cellCentre = (c: number, r: number): [number, number] => [c * TILE + TILE / 2, r * TILE + TILE / 2];
export const cellAt = (x: number, y: number): [number, number] => [Math.floor(x / TILE), Math.floor(y / TILE)];
