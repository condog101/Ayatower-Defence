import Phaser from 'phaser';
import { DEPTH, MAP_H, MAP_W, MAP_X, MAP_Y } from '../data/balance';
import { TOWERS } from '../data/towers';
import { TILE } from '../sim/const';
import type { PlaceReason, Sim } from '../sim/sim';
import type { TowerKey } from '../sim/types';
import { COLORS } from '../systems/UI';
import { TowerView } from './TowerView';
import { button, label, type Button } from './widgets';

export type PlaceMode = 'hover' | 'drag' | 'tap';

const REASON: Record<PlaceReason, string> = {
  cash: 'NOT ENOUGH RIALS',
  terrain: 'CAN\'T BUILD THERE',
  occupied: 'SPOT TAKEN',
  locked: 'LOCKED',
  bounds: '',
};

/**
 * The placement ghost: a translucent tower plus its range ring that snaps to the cell under the
 * pointer, green when it can go there and red when it can't. Touch tap-mode adds PLACE / X buttons.
 */
export class Placement {
  key: TowerKey | null = null;
  mode: PlaceMode = 'hover';
  cell: [number, number] | null = null;
  private ghost: Phaser.GameObjects.Container;
  private ring: Phaser.GameObjects.Graphics;
  private why: Phaser.GameObjects.Text;
  private placeBtn: Button;
  private cancelBtn: Button;

  constructor(
    private scene: Phaser.Scene,
    private sim: Sim,
    private onCommit: () => void,
    private onCancel: () => void,
  ) {
    this.ghost = scene.add.container(0, 0).setDepth(DEPTH.ghost).setVisible(false).setAlpha(0.7);
    this.ring = scene.add.graphics().setDepth(DEPTH.ghost - 1);
    this.why = label(scene, 0, 0, '', 8, COLORS.red, DEPTH.ghost + 1).setOrigin(0.5).setStroke('#000', 3).setVisible(false);
    this.placeBtn = button(scene, 0, 0, 120, 40, 'PLACE', () => this.commitTap(), 12, DEPTH.ghost + 2).setVisible(false);
    this.cancelBtn = button(scene, 0, 0, 44, 40, 'X', () => this.onCancel(), 12, DEPTH.ghost + 2).setVisible(false);
  }

  get active(): boolean {
    return this.key !== null;
  }

  begin(key: TowerKey, mode: PlaceMode) {
    this.key = key;
    this.mode = mode;
    this.cell = null;
    this.ghost.removeAll(true);
    const { base, turret } = TowerView.make(this.scene, TOWERS[key], 0, 0, 0, 0);
    this.ghost.add(base);
    if (turret) this.ghost.add(turret);
    this.ghost.setVisible(false);
    this.ring.clear();
    this.why.setVisible(false);
    this.placeBtn.setVisible(false);
    this.cancelBtn.setVisible(mode === 'tap');
    if (mode === 'tap') this.cancelBtn.root.setPosition(MAP_X + MAP_W - 52, MAP_Y + 8);
  }

  end() {
    this.key = null;
    this.cell = null;
    this.ghost.setVisible(false);
    this.ring.clear();
    this.why.setVisible(false);
    this.placeBtn.setVisible(false);
    this.cancelBtn.setVisible(false);
  }

  /** Map-space cell under a screen point, or null off the map. */
  static cellAt(x: number, y: number): [number, number] | null {
    if (x < MAP_X || y < MAP_Y || x >= MAP_X + MAP_W || y >= MAP_Y + MAP_H) return null;
    return [Math.floor((x - MAP_X) / TILE), Math.floor((y - MAP_Y) / TILE)];
  }

  /** Move the ghost to the cell under a screen point. */
  moveTo(x: number, y: number) {
    if (!this.key) return;
    const cell = Placement.cellAt(x, y);
    this.cell = cell;
    this.ring.clear();
    if (!cell) {
      this.ghost.setVisible(false);
      this.why.setVisible(false);
      this.placeBtn.setVisible(false);
      return;
    }
    const [c, r] = cell;
    const cx = MAP_X + c * TILE + TILE / 2;
    const cy = MAP_Y + r * TILE + TILE / 2;
    const check = this.sim.canPlace(this.key, c, r);
    this.ghost.setPosition(cx, cy).setVisible(true);
    TowerView.drawRange(this.ring, cx, cy, TOWERS[this.key].tiers[0].range, check.ok);
    this.ring.lineStyle(2, check.ok ? 0x6dff8f : 0xff4a4a, 1).strokeRect(cx - TILE / 2, cy - TILE / 2, TILE, TILE);
    const why = check.ok ? '' : REASON[check.reason!];
    this.why.setText(why).setPosition(cx, cy - 26).setVisible(!!why);
    if (this.mode === 'tap') {
      // PLACE sits under the ghost, or above it near the bottom edge.
      const by = cy + 28 + 40 > MAP_Y + MAP_H ? cy - 30 - 40 : cy + 28;
      const bx = Math.max(MAP_X + 4, Math.min(MAP_X + MAP_W - 124, cx - 60));
      this.placeBtn.root.setPosition(bx, by);
      this.placeBtn.setVisible(true).setEnabled(check.ok);
    }
  }

  valid(): boolean {
    return !!(this.key && this.cell && this.sim.canPlace(this.key, this.cell[0], this.cell[1]).ok);
  }

  private commitTap() {
    if (this.valid()) this.onCommit();
  }
}
