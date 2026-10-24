import Phaser from 'phaser';
import { DEPTH, L } from '../data/balance';
import type { Sim } from '../sim/sim';
import type { Tower } from '../sim/types';
import { COLORS, FONT, uiSize } from '../systems/UI';
import { TowerView } from './TowerView';
import { rectButton, type Button } from './widgets';

export interface PanelActions {
  upgrade(t: Tower): void;
  sell(t: Tower): void;
  target(t: Tower): void;
  close(): void;
}

function stats(t: Tower): string {
  const tier = t.def.tiers[t.tier];
  if (t.def.role === 'support') return tier.blurb;
  const rate = 60 / Math.max(1, tier.cooldown / t.buff.rate);
  const dmg = Math.round(tier.damage * t.buff.dmg * 10) / 10;
  const shots = tier.multishot ? ` x${tier.multishot}` : '';
  const hits = [tier.hitsSea ? 'SEA' : '', tier.hitsAir ? 'AIR' : ''].filter(Boolean).join('+');
  return [`DMG ${dmg}${shots}`, tier.dmgKind.toUpperCase(), `RANGE ${Math.round(tier.range * t.buff.range)}`, `RATE ${rate.toFixed(1)}/S`, `HITS ${hits}`, `KILLS ${t.kills}`].join('\n');
}

/** The selected tower in the right strip: what it is, its stats, UPGRADE / SELL / TARGET. Replaces the shop. */
export class TowerPanel {
  private root: Phaser.GameObjects.Container;
  private name: Phaser.GameObjects.Text;
  private tierText: Phaser.GameObjects.Text;
  private statsText: Phaser.GameObjects.Text;
  private icon: Phaser.GameObjects.Container;
  private upgradeBtn: Button;
  private sellBtn: Button;
  private targetBtn: Button;
  private buttons: Button[];
  tower: Tower | null = null;

  constructor(
    private scene: Phaser.Scene,
    private sim: Sim,
    actions: PanelActions,
  ) {
    const s = scene;
    const side = L.game.side;
    const wrap = side.w - 8;
    const txt = (y: number, size: number, color: string, w = wrap) =>
      s.add.text(4, y, '', { fontFamily: FONT, fontSize: `${uiSize(size)}px`, color, lineSpacing: 4, wordWrap: { width: w } }).setOrigin(0);
    const bg = s.add.rectangle(0, 0, side.w, side.h, 0x14110d, 1).setOrigin(0).setStrokeStyle(2, 0xb88c1e);
    this.name = txt(6, 8, COLORS.gold, wrap - L.game.close.w);
    this.tierText = txt(L.touch ? 56 : 40, 8, COLORS.text);
    this.icon = s.add.container(side.w / 2, L.touch ? 140 : 108);
    this.statsText = txt(L.touch ? 176 : 144, 8, COLORS.dim);
    const [b0, b1, b2] = L.game.sideButtons;
    this.upgradeBtn = rectButton(s, b0, '', () => this.tower && actions.upgrade(this.tower), 8, DEPTH.hud + 1);
    this.sellBtn = rectButton(s, b1, '', () => this.tower && actions.sell(this.tower), 8, DEPTH.hud + 1);
    this.targetBtn = rectButton(s, b2, '', () => this.tower && actions.target(this.tower), 8, DEPTH.hud + 1);
    const close = rectButton(s, L.game.close, 'X', () => actions.close(), 10, DEPTH.hud + 1);
    this.root = s.add.container(side.x, side.y, [bg, this.name, this.tierText, this.icon, this.statsText]).setDepth(DEPTH.hud);
    this.buttons = [this.upgradeBtn, this.sellBtn, this.targetBtn, close];
    this.show(null);
  }

  show(t: Tower | null) {
    this.tower = t;
    this.root.setVisible(!!t);
    for (const b of this.buttons) b.setVisible(!!t);
    if (!t) return;
    this.icon.removeAll(true);
    const { base, turret } = TowerView.make(this.scene, t.def, t.tier, 0, 0, 0, 2);
    this.icon.add(base);
    if (turret) this.icon.add(turret);
    this.targetBtn.setVisible(t.def.role === 'attack' && t.def.tiers[t.tier].projectile !== 'mine');
    this.refresh();
  }

  /** Re-read the tower (cash changes, upgrades, kills). */
  refresh() {
    const t = this.tower;
    if (!t) return;
    const tier = t.def.tiers[t.tier];
    this.name.setText(t.def.name);
    this.tierText.setText(`TIER ${t.tier + 1}/3\n${tier.name}`);
    this.statsText.setText(stats(t));
    const cost = this.sim.upgradeCost(t);
    if (cost === null) this.upgradeBtn.setLabel('MAX TIER').setEnabled(false);
    else this.upgradeBtn.setLabel(`UPGRADE\n${cost}`).setEnabled(this.sim.cash >= cost);
    this.sellBtn.setLabel(`SELL +${this.sim.sellValue(t)}`);
    this.targetBtn.setLabel(`TARGET\n${t.targeting.toUpperCase()}`);
  }
}
