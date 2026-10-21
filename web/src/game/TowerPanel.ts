import Phaser from 'phaser';
import { DEPTH, HUD_H, SIDE_X } from '../data/balance';
import type { Sim } from '../sim/sim';
import type { Tower } from '../sim/types';
import { COLORS, FONT, uiSize } from '../systems/UI';
import { TowerView } from './TowerView';
import { button, type Button } from './widgets';

export interface PanelActions {
  upgrade(t: Tower): void;
  sell(t: Tower): void;
  target(t: Tower): void;
  close(): void;
}

const W = 154;

function stats(t: Tower): string {
  const tier = t.def.tiers[t.tier];
  if (t.def.role === 'support') return tier.blurb;
  const rate = 60 / Math.max(1, tier.cooldown / t.buff.rate);
  const dmg = Math.round(tier.damage * t.buff.dmg * 10) / 10;
  const shots = tier.multishot ? ` x${tier.multishot}` : '';
  const lines = [`DMG ${dmg}${shots}  ${tier.dmgKind.toUpperCase()}`, `RANGE ${Math.round(tier.range * t.buff.range)}`, `RATE ${rate.toFixed(1)}/S`, `KILLS ${t.kills}`];
  const hits = [tier.hitsSea ? 'SEA' : '', tier.hitsAir ? 'AIR' : ''].filter(Boolean).join('+');
  lines.push(`HITS ${hits}`);
  return lines.join('\n');
}

/** The selected tower: what it is, its stats, UPGRADE / SELL / TARGET. Replaces the shop grid. */
export class TowerPanel {
  private root: Phaser.GameObjects.Container;
  private name: Phaser.GameObjects.Text;
  private tierText: Phaser.GameObjects.Text;
  private statsText: Phaser.GameObjects.Text;
  private icon: Phaser.GameObjects.Container;
  private upgradeBtn: Button;
  private sellBtn: Button;
  private targetBtn: Button;
  tower: Tower | null = null;

  constructor(
    private scene: Phaser.Scene,
    private sim: Sim,
    actions: PanelActions,
  ) {
    const s = scene;
    const x = SIDE_X + 3;
    const y = HUD_H + 4;
    const txt = (yy: number, size: number, color: string) =>
      s.add.text(6, yy, '', { fontFamily: FONT, fontSize: `${uiSize(size)}px`, color, lineSpacing: 5, wordWrap: { width: W - 12 } }).setOrigin(0);
    const bg = s.add.rectangle(0, 0, W, 348, 0x14110d, 1).setOrigin(0).setStrokeStyle(2, 0xb88c1e);
    this.name = txt(8, 8, COLORS.gold).setWordWrapWidth(W - 40);
    this.tierText = txt(36, 8, COLORS.text);
    this.icon = s.add.container(W / 2, 92);
    this.statsText = txt(124, 8, COLORS.dim);
    const by = 222;
    const btn = (yy: number, h: number, label: string, fn: () => void) => {
      const b = button(s, x + 6, y + yy, W - 12, h, label, () => this.tower && fn(), 8, DEPTH.hud + 1);
      return b;
    };
    this.upgradeBtn = btn(by, 40, '', () => actions.upgrade(this.tower!));
    this.sellBtn = btn(by + 46, 30, '', () => actions.sell(this.tower!));
    this.targetBtn = btn(by + 82, 30, '', () => actions.target(this.tower!));
    const close = button(s, x + W - 26, y + 4, 22, 22, 'X', () => actions.close(), 8, DEPTH.hud + 1);
    this.root = s.add.container(x, y, [bg, this.name, this.tierText, this.icon, this.statsText]).setDepth(DEPTH.hud);
    this.buttons = [this.upgradeBtn, this.sellBtn, this.targetBtn, close];
    this.show(null);
  }

  private buttons: Button[];

  show(t: Tower | null) {
    this.tower = t;
    this.root.setVisible(!!t);
    for (const b of this.buttons) b.setVisible(!!t);
    if (!t) return;
    this.icon.removeAll(true);
    const { base, turret } = TowerView.make(this.scene, t.def, t.tier, 0, 0, 0, 3);
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
    else this.upgradeBtn.setLabel(`UPGRADE ${cost}\n${t.def.tiers[t.tier + 1].name}`).setEnabled(this.sim.cash >= cost);
    this.sellBtn.setLabel(`SELL +${this.sim.sellValue(t)}`);
    this.targetBtn.setLabel(`TARGET: ${t.targeting.toUpperCase()}`);
  }
}
