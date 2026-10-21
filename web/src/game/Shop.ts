import Phaser from 'phaser';
import { DEPTH, HEIGHT, HUD_H, MAP_X, PX, SIDE_W, SIDE_X } from '../data/balance';
import { TOWER_KEYS, TOWERS } from '../data/towers';
import type { Sim } from '../sim/sim';
import type { TowerDef, TowerKey } from '../sim/types';
import { TOUCH } from '../systems/Device';
import { COLORS, FONT, panel, uiSize } from '../systems/UI';
import { TowerView } from './TowerView';

export const CARD_W = 76;
export const CARD_H = 56;
const GAP = 2;
const X0 = SIDE_X + 3;
const Y0 = HUD_H + 4;

export const cardPos = (i: number): [number, number] => [X0 + (i % 2) * (CARD_W + GAP), Y0 + Math.floor(i / 2) * (CARD_H + GAP)];
/** Bottom of the card grid (the tower panel covers the same area). */
export const SHOP_BOTTOM = Y0 + 6 * (CARD_H + GAP);

interface Card {
  key: TowerKey;
  root: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Rectangle;
  cost: Phaser.GameObjects.Text;
  lock: Phaser.GameObjects.Text | null;
}

export interface ShopActions {
  /** Pointer went down on a card. */
  down(key: TowerKey, pointer: Phaser.Input.Pointer): void;
}

/**
 * The sidebar shop: a 2x6 grid of tower cards (locked / unaffordable / ok), with a tooltip of the
 * tower's pros and cons on hover (desktop) or while placing (touch).
 */
export class Shop {
  private cards: Card[] = [];
  private root: Phaser.GameObjects.Container;
  private tip: Phaser.GameObjects.Container;
  private tipText: Phaser.GameObjects.Text;
  private tipPanel: Phaser.GameObjects.NineSlice;
  selected: TowerKey | null = null;

  constructor(
    scene: Phaser.Scene,
    private sim: Sim,
    actions: ShopActions,
  ) {
    const s = scene;
    s.add.rectangle(SIDE_X, HUD_H, SIDE_W, HEIGHT - HUD_H, 0x0b0a08, 0.94).setOrigin(0).setDepth(DEPTH.hud - 2);
    s.add.rectangle(SIDE_X, HUD_H, 1, HEIGHT - HUD_H, 0xb88c1e).setOrigin(0).setDepth(DEPTH.hud - 1);
    this.root = s.add.container(0, 0).setDepth(DEPTH.hud);
    TOWER_KEYS.forEach((key, i) => {
      const def = TOWERS[key];
      const [x, y] = cardPos(i);
      const unlocked = sim.level.towers.includes(key);
      const frame = s.add.rectangle(0, 0, CARD_W, CARD_H, 0x1c1914, 1).setOrigin(0).setStrokeStyle(2, 0x3a362e);
      const items: Phaser.GameObjects.GameObject[] = [frame];
      let cost: Phaser.GameObjects.Text;
      let lock: Phaser.GameObjects.Text | null = null;
      if (unlocked) {
        const { base, turret } = TowerView.make(s, def, 0, CARD_W / 2, 22, 0, PX);
        items.push(base);
        if (turret) items.push(turret);
        cost = s.add.text(CARD_W / 2, CARD_H - 10, String(def.tiers[0].cost), { fontFamily: FONT, fontSize: `${uiSize(8)}px`, color: COLORS.gold }).setOrigin(0.5);
      } else {
        cost = s.add.text(CARD_W / 2, CARD_H - 10, '', { fontFamily: FONT, fontSize: `${uiSize(8)}px`, color: COLORS.dim }).setOrigin(0.5);
        lock = s.add.text(CARD_W / 2, 22, def.unlockLevel <= 10 ? `L${def.unlockLevel}` : '?', { fontFamily: FONT, fontSize: '8px', color: '#5a5448' }).setOrigin(0.5);
        items.push(lock);
      }
      items.push(cost);
      const root = s.add.container(x, y, items);
      this.root.add(root);
      if (unlocked) {
        const pad = TOUCH ? 1 : 0;
        frame.setInteractive(new Phaser.Geom.Rectangle(-pad, -pad, CARD_W + 2 * pad, CARD_H + 2 * pad), Phaser.Geom.Rectangle.Contains);
        frame.on('pointerdown', (p: Phaser.Input.Pointer) => !p.rightButtonDown() && actions.down(key, p));
        if (!TOUCH) {
          frame.on('pointerover', () => this.showTip(key));
          frame.on('pointerout', () => this.selected !== key && this.showTip(this.selected));
        }
      }
      this.cards.push({ key, root, frame, cost, lock });
    });
    // Tooltip: left of the sidebar on desktop; top-left of the map on touch (the tap-mode X sits top-right).
    const tw = TOUCH ? 300 : 250;
    this.tipText = s.add
      .text(12, 12, '', { fontFamily: FONT, fontSize: `${uiSize(8)}px`, color: COLORS.text, lineSpacing: 5, wordWrap: { width: tw - 24 } })
      .setOrigin(0);
    this.tipPanel = panel(s, 0, 0, tw, 100);
    this.tip = s.add
      .container(TOUCH ? MAP_X + 6 : SIDE_X - tw - 6, HUD_H + 6, [this.tipPanel, this.tipText])
      .setDepth(DEPTH.hud + 2)
      .setVisible(false);
  }

  showTip(key: TowerKey | null) {
    if (!key) {
      this.tip.setVisible(false);
      return;
    }
    const def: TowerDef = TOWERS[key];
    const t0 = def.tiers[0];
    this.tipText.setText(`${def.name}  ${t0.cost}\n${def.basis}\n+ ${def.pro}\n- ${def.con}\n${t0.blurb}`);
    this.tipText.setColor(COLORS.text);
    // nineslice size is in unscaled units (the panel is drawn at 2x)
    this.tipPanel.setSize(this.tipPanel.width, Math.ceil((this.tipText.height + 24) / 2));
    this.tip.setVisible(true);
  }

  setVisible(on: boolean) {
    this.root.setVisible(on);
    for (const c of this.cards) {
      if (on) c.frame.input && c.frame.setInteractive();
      else c.frame.disableInteractive();
    }
  }

  update() {
    for (const c of this.cards) {
      if (c.lock) continue;
      const cost = TOWERS[c.key].tiers[0].cost;
      const ok = this.sim.cash >= cost;
      c.cost.setColor(ok ? COLORS.gold : COLORS.red);
      c.root.setAlpha(ok ? 1 : 0.55);
      c.frame.setStrokeStyle(2, this.selected === c.key ? 0xffd84a : ok ? 0x5a5448 : 0x3a362e);
    }
  }
}
