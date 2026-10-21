import Phaser from 'phaser';
import { DEPTH, HEIGHT, MAP_H, MAP_W, MAP_X, MAP_Y, PX, WIDTH } from '../data/balance';
import { COLS, ROWS, TILE } from '../sim/const';
import { cellKind, isPlaceable, isWet, type CellKind, type Grid } from '../sim/grid';
import type { Lane } from '../sim/path';
import type { TowerDef } from '../sim/types';

// tiles.png frames
const T_WATER = 0;
const T_LANE = 4;
const T_SHALLOW = 5;
const T_SAND_SHORE = 7; // 6 is plain sand; shores are 7 + 4-bit mask N1 E2 S4 W8 of wet neighbours
const T_ROCK_SHORE = 24; // 23 + mask 0 would be plain rock
export const T_HATCH_OK = 40;
export const T_HATCH_BAD = 41;
const T_BUOY = 42;

// decor.png frames
const DECOR: Partial<Record<CellKind, number>> = { palm: 0, village: 1, mosque: 2, oil: 3 };

/**
 * The level's terrain: an animated water underlay across the whole canvas, the static ground baked
 * into one RenderTexture (shore edges auto-tiled from wet neighbours), decor, the Ayatower, and a
 * placement overlay that hatches the cells a tower could go on.
 */
export class MapView {
  private water: Phaser.GameObjects.TileSprite;
  private waterFrame = 0;
  private waterAcc = 0;
  private overlay: Phaser.GameObjects.Container;
  readonly aya: Phaser.GameObjects.Sprite;
  private ayaRest = 0;

  constructor(
    private scene: Phaser.Scene,
    private grid: Grid,
    laneCells: [number, number][],
    lanes: Lane[] = [],
  ) {
    const s = scene;
    this.water = s.add.tileSprite(0, 0, WIDTH, HEIGHT, 'tiles', T_WATER).setOrigin(0).setTileScale(PX).setDepth(DEPTH.water);
    const rt = s.add.renderTexture(MAP_X, MAP_Y, MAP_W / PX, MAP_H / PX).setOrigin(0).setScale(PX).setDepth(DEPTH.ground);
    const half = TILE / PX;
    const buoys = new Set(laneCells.filter((_, i) => i % 7 === 3).map(([c, r]) => `${c},${r}`));
    let ayaCell: [number, number] = [0, 0];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const k = cellKind(grid, c, r);
        const x = c * half;
        const y = r * half;
        let frame = -1;
        if (k === 'lane') frame = buoys.has(`${c},${r}`) ? T_BUOY : T_LANE;
        else if (k === 'shallow') frame = T_SHALLOW;
        else if (k === 'rock') frame = T_ROCK_SHORE + this.mask(c, r);
        else if (k === 'land' || k === 'palm' || k === 'village' || k === 'mosque' || k === 'aya') frame = T_SAND_SHORE + this.mask(c, r);
        if (k === 'aya') ayaCell = [c, r];
        if (frame >= 0) rt.stamp('tiles', frame, x, y, { originX: 0, originY: 0 });
        const decor = DECOR[k];
        if (decor !== undefined) {
          s.add.image(MAP_X + c * TILE + TILE / 2, MAP_Y + r * TILE + TILE / 2, 'decor', decor).setScale(PX).setDepth(DEPTH.decor + r * 0.01);
        }
      }
    }
    const [ac, ar] = ayaCell;
    this.aya = s.add
      // kept inside the map when the Ayatower sits on an edge column
      .sprite(Math.max(MAP_X + TILE, Math.min(MAP_X + MAP_W - TILE, MAP_X + ac * TILE + TILE / 2)), MAP_Y + ar * TILE + TILE, 'ayatower', 0)
      .setOrigin(0.5, 0.85)
      .setScale(PX)
      .setDepth(DEPTH.towers + 1);
    this.overlay = s.add.container(0, 0).setDepth(DEPTH.ghost - 1).setVisible(false);
    this.drawLanes(lanes);
  }

  /** The sea lanes as a faint channel with a dashed centre line, so the routes read at a glance. */
  private drawLanes(lanes: Lane[]) {
    const g = this.scene.add.graphics().setDepth(DEPTH.ground + 1);
    for (const lane of lanes) {
      const pts: [number, number][] = [];
      for (let d = 0; d <= lane.length; d += 8) pts.push(lane.posAt(d));
      pts.push(lane.posAt(lane.length));
      g.lineStyle(20, 0x7fe0e8, 0.14);
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(MAP_X + x, MAP_Y + y) : g.moveTo(MAP_X + x, MAP_Y + y)));
      g.strokePath();
      g.lineStyle(2, 0xd8f4f6, 0.3);
      for (let d = 0; d < lane.length; d += 28) {
        const [x0, y0] = lane.posAt(d);
        const [x1, y1] = lane.posAt(Math.min(lane.length, d + 12));
        g.lineBetween(MAP_X + x0, MAP_Y + y0, MAP_X + x1, MAP_Y + y1);
      }
    }
  }

  /** 4-bit mask of wet orthogonal neighbours (N1 E2 S4 W8); off-map counts as more land. */
  private mask(c: number, r: number): number {
    const wet = (cc: number, rr: number) => {
      if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) return false;
      return isWet(cellKind(this.grid, cc, rr));
    };
    return (wet(c, r - 1) ? 1 : 0) | (wet(c + 1, r) ? 2 : 0) | (wet(c, r + 1) ? 4 : 0) | (wet(c - 1, r) ? 8 : 0);
  }

  /** Hatch every free cell this tower could go on (null hides the overlay). */
  showPlacement(def: TowerDef | null, occupied: (c: number, r: number) => boolean) {
    this.overlay.removeAll(true);
    if (!def) {
      this.overlay.setVisible(false);
      return;
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!isPlaceable(this.grid, c, r, def.placement) || occupied(c, r)) continue;
        this.overlay.add(
          this.scene.add.image(MAP_X + c * TILE, MAP_Y + r * TILE, 'tiles', T_HATCH_OK).setOrigin(0).setScale(PX).setAlpha(0.28),
        );
      }
    }
    this.overlay.setVisible(true);
  }

  /** Ayatower reacts: 1 blink, 2 staff slam, 3 hurt. */
  ayaFrame(frame: number, ms = 400) {
    this.aya.setFrame(frame);
    this.scene.time.delayedCall(ms, () => this.aya.setFrame(this.ayaRest));
  }

  update(dtMs: number) {
    this.waterAcc += dtMs;
    if (this.waterAcc > 450) {
      this.waterAcc = 0;
      this.waterFrame = (this.waterFrame + 1) % 4;
      this.water.setFrame(T_WATER + this.waterFrame);
    }
    this.water.tilePositionX += dtMs * 0.004;
  }
}
