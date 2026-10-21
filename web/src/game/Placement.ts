import Phaser from 'phaser';
import { DEPTH, L, MAP_H, MAP_W, MAP_X, MAP_Y } from '../data/balance';
import { TOWERS } from '../data/towers';
import { TILE } from '../sim/const';
import type { PlaceReason, Sim } from '../sim/sim';
import type { TowerKey } from '../sim/types';
import { COLORS, FONT, uiSize } from '../systems/UI';
import { TowerView } from './TowerView';
import { label, rectButton, type Button } from './widgets';

export type PlaceMode = 'hover' | 'drag' | 'tap';

const REASON: Record<PlaceReason, string> = {
  cash: 'THE TREASURY IS EMPTY',
  terrain: 'NO FOUNDATION HERE',
  occupied: 'ALREADY HELD',
  locked: 'NOT YET REVEALED',
  bounds: '',
};

/**
 * The placement ghost: a translucent tower plus its range ring that snaps to a map cell, green
 * when it can go there and red when it can't. Touch tap-mode swaps the shop for a panel with the
 * tower's details and PLACE / CANCEL.
 */
export class Placement {
  key: TowerKey | null = null;
  mode: PlaceMode = 'hover';
  cell: [number, number] | null = null;
  private ghost: Phaser.GameObjects.Container;
  private ring: Phaser.GameObjects.Graphics;
  private why: Phaser.GameObjects.Text;
  private panel: Phaser.GameObjects.Container;
  private panelText: Phaser.GameObjects.Text;
  private placeBtn: Button;
  private cancelBtn: Button;

  constructor(
    private scene: Phaser.Scene,
    private sim: Sim,
    private onCommit: () => void,
    private onCancel: () => void,
  ) {
    const s = scene;
    this.ghost = s.add.container(0, 0).setDepth(DEPTH.ghost).setVisible(false).setAlpha(0.7);
    this.ring = s.add.graphics().setDepth(DEPTH.ghost - 1);
    this.why = label(s, 0, 0, '', 8, COLORS.red, DEPTH.ghost + 1).setOrigin(0.5).setStroke('#000', 3).setVisible(false);
    const side = L.game.side;
    const bg = s.add.rectangle(0, 0, side.w, side.h, 0x14110d, 1).setOrigin(0).setStrokeStyle(2, 0xb88c1e);
    this.panelText = s.add
      .text(4, 6, '', { fontFamily: FONT, fontSize: `${uiSize(8)}px`, color: COLORS.text, lineSpacing: 4, wordWrap: { width: side.w - 8 } })
      .setOrigin(0);
    this.panel = s.add.container(side.x, side.y, [bg, this.panelText]).setDepth(DEPTH.hud).setVisible(false);
    this.placeBtn = rectButton(s, L.game.sideButtons[1], 'PLACE', () => this.valid() && this.onCommit(), 12, DEPTH.hud + 1).setVisible(false);
    this.cancelBtn = rectButton(s, L.game.sideButtons[2], 'CANCEL', () => this.onCancel(), 10, DEPTH.hud + 1).setVisible(false);
  }

  get active(): boolean {
    return this.key !== null;
  }

  begin(key: TowerKey, mode: PlaceMode) {
    this.key = key;
    this.cell = null;
    this.ghost.removeAll(true);
    const { base, turret } = TowerView.make(this.scene, TOWERS[key], 0, 0, 0, 0);
    this.ghost.add(base);
    if (turret) this.ghost.add(turret);
    this.ghost.setVisible(false);
    this.ring.clear();
    this.why.setVisible(false);
    const d = TOWERS[key];
    this.panelText.setText(`${d.name}\n${d.tiers[0].cost} RIALS\n\n+ ${d.pro}\n- ${d.con}\n\n${d.tiers[0].blurb}`);
    this.setMode(mode);
  }

  setMode(mode: PlaceMode) {
    this.mode = mode;
    const tap = mode === 'tap';
    this.panel.setVisible(tap);
    this.placeBtn.setVisible(tap).setEnabled(this.valid());
    this.cancelBtn.setVisible(tap);
  }

  end() {
    this.key = null;
    this.cell = null;
    this.ghost.setVisible(false);
    this.ring.clear();
    this.why.setVisible(false);
    this.panel.setVisible(false);
    this.placeBtn.setVisible(false);
    this.cancelBtn.setVisible(false);
  }

  /** Map-space cell under a screen point, or null off the map. */
  static cellAt(x: number, y: number): [number, number] | null {
    if (x < MAP_X || y < MAP_Y || x >= MAP_X + MAP_W || y >= MAP_Y + MAP_H) return null;
    return [Math.floor((x - MAP_X) / TILE), Math.floor((y - MAP_Y) / TILE)];
  }

  /** Move the ghost to the cell under a screen point; `clamp` pins it to the nearest map cell (finger drags). */
  moveTo(x: number, y: number, clamp = false) {
    if (!this.key) return;
    if (clamp) {
      x = Math.max(MAP_X, Math.min(MAP_X + MAP_W - 1, x));
      y = Math.max(MAP_Y, Math.min(MAP_Y + MAP_H - 1, y));
    }
    const cell = Placement.cellAt(x, y);
    this.cell = cell;
    this.ring.clear();
    if (!cell) {
      this.ghost.setVisible(false);
      this.why.setVisible(false);
      this.placeBtn.setEnabled(false);
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
    this.why.setText(why).setPosition(cx, cy - 28 < MAP_Y + 10 ? cy + 28 : cy - 28).setVisible(!!why);
    this.placeBtn.setEnabled(check.ok);
  }

  valid(): boolean {
    return !!(this.key && this.cell && this.sim.canPlace(this.key, this.cell[0], this.cell[1]).ok);
  }
}
