import Phaser from 'phaser';
import { DEPTH, L, PX } from '../data/balance';
import { TOWER_KEYS, TOWERS } from '../data/towers';
import type { Sim } from '../sim/sim';
import type { TowerKey } from '../sim/types';
import { TOUCH } from '../systems/Device';
import { COLORS, FONT, uiSize } from '../systems/UI';
import { TowerView } from './TowerView';

interface Card {
  key: TowerKey;
  root: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Rectangle;
  cost: Phaser.GameObjects.Text;
  locked: boolean;
}

export interface ShopActions {
  /** Pointer went down on a card. */
  down(key: TowerKey, pointer: Phaser.Input.Pointer): void;
  /** Hovered card (desktop), for the hint line; null when the pointer leaves. */
  hover(key: TowerKey | null): void;
}

/** One line about a tower for the hint strip. */
export function towerTip(key: TowerKey): string {
  const d = TOWERS[key];
  return `${d.name} ${d.tiers[0].cost}: + ${d.pro}. - ${d.con}.`;
}

/** The shop in the right strip: a 2-column grid of tower cards (locked / unaffordable / ok). */
export class Shop {
  private cards: Card[] = [];
  selected: TowerKey | null = null;

  constructor(
    scene: Phaser.Scene,
    private sim: Sim,
    actions: ShopActions,
  ) {
    const s = scene;
    TOWER_KEYS.forEach((key, i) => {
      const def = TOWERS[key];
      const r = L.game.cards[i];
      const locked = !sim.level.towers.includes(key);
      const frame = s.add.rectangle(0, 0, r.w, r.h, 0x1c1914, 1).setOrigin(0).setStrokeStyle(2, 0x3a362e);
      const items: Phaser.GameObjects.GameObject[] = [frame];
      const cost = s.add
        .text(r.w / 2, r.h - 11, locked ? '' : String(def.tiers[0].cost), { fontFamily: FONT, fontSize: `${uiSize(8)}px`, color: COLORS.gold })
        .setOrigin(0.5);
      if (locked) {
        items.push(s.add.text(r.w / 2, r.h / 2 - 4, `L${def.unlockLevel}`, { fontFamily: FONT, fontSize: `${uiSize(8)}px`, color: '#5a5448' }).setOrigin(0.5));
      } else {
        const { base, turret } = TowerView.make(s, def, 0, r.w / 2, r.h / 2 - 8, 0, PX);
        items.push(base);
        if (turret) items.push(turret);
      }
      items.push(cost);
      const root = s.add.container(r.x, r.y, items).setDepth(DEPTH.hud);
      if (!locked) {
        frame.setInteractive(new Phaser.Geom.Rectangle(-L.slop, -L.slop, r.w + 2 * L.slop, r.h + 2 * L.slop), Phaser.Geom.Rectangle.Contains);
        frame.on('pointerdown', (p: Phaser.Input.Pointer) => !p.rightButtonDown() && actions.down(key, p));
        if (!TOUCH) {
          frame.on('pointerover', () => actions.hover(key));
          frame.on('pointerout', () => actions.hover(null));
        }
      }
      this.cards.push({ key, root, frame, cost, locked });
    });
  }

  setVisible(on: boolean) {
    for (const c of this.cards) {
      c.root.setVisible(on);
      if (c.locked) continue;
      if (on) c.frame.setInteractive();
      else c.frame.disableInteractive();
    }
  }

  update() {
    for (const c of this.cards) {
      if (c.locked) continue;
      const ok = this.sim.cash >= TOWERS[c.key].tiers[0].cost;
      c.cost.setColor(ok ? COLORS.gold : COLORS.red);
      c.root.setAlpha(ok ? 1 : 0.55);
      c.frame.setStrokeStyle(2, this.selected === c.key ? 0xffd84a : ok ? 0x5a5448 : 0x3a362e);
    }
  }
}
