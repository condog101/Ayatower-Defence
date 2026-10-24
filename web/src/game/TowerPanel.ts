import Phaser from 'phaser';
import { DEPTH, L } from '../data/balance';
import type { Sim } from '../sim/sim';
import { tierOf } from '../sim/tiers';
import type { PathIndex, Tower } from '../sim/types';
import { COLORS, FONT, uiSize } from '../systems/UI';
import { TowerView } from './TowerView';
import { rectButton, type Button } from './widgets';

export interface PanelActions {
  upgrade(t: Tower, path: PathIndex): void;
  sell(t: Tower): void;
  target(t: Tower): void;
  close(): void;
  /** Desktop: a path button is hovered (its name and blurb for the hint line), or null when it's left. */
  hint(s: string | null): void;
}

const PATH_LETTER = ['A', 'B'] as const;

function stats(t: Tower): string {
  const tier = tierOf(t);
  if (t.def.role === 'support') return tier.blurb;
  const rate = 60 / Math.max(1, tier.cooldown / t.buff.rate);
  const dmg = Math.round(tier.damage * t.buff.dmg * 10) / 10;
  const shots = tier.multishot ? ` x${tier.multishot}` : '';
  const hits = [tier.hitsSea ? 'SEA' : '', tier.hitsAir ? 'AIR' : ''].filter(Boolean).join('+');
  return [`DMG ${dmg}${shots}`, tier.dmgKind.toUpperCase(), `RANGE ${Math.round(tier.range * t.buff.range)}`, `RATE ${rate.toFixed(1)}/S`, `HITS ${hits}`, `KILLS ${t.kills}`].join('\n');
}

/**
 * The selected tower in the right strip: what it is, its stats, and PATH A / PATH B / SELL / TARGET.
 * At the base tier both paths are offered; once one is bought the other button hides for good.
 * Replaces the shop.
 */
export class TowerPanel {
  private root: Phaser.GameObjects.Container;
  private name: Phaser.GameObjects.Text;
  private tierText: Phaser.GameObjects.Text;
  private statsText: Phaser.GameObjects.Text;
  private nextText: Phaser.GameObjects.Text;
  private icon: Phaser.GameObjects.Container;
  private pathBtns: [Button, Button];
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
    // The header stays two lines (TIER n/3 + path letter, then the tier name): a path name here would
    // wrap into the icon on the narrowest strip. Path names go in the NEXT block and the hint line.
    this.tierText = txt(L.touch ? 48 : 40, 8, COLORS.text);
    this.icon = s.add.container(side.w / 2, L.touch ? 112 : 108);
    this.statsText = txt(L.touch ? 150 : 144, 8, COLORS.dim);
    this.nextText = txt(232, 8, COLORS.text).setVisible(!L.touch);
    const [b0, b1, b2, b3] = L.game.sideButtons;
    const pathBtn = (r: typeof b0, path: PathIndex) =>
      rectButton(s, r, '', () => this.tower && actions.upgrade(this.tower, this.tower.tier === 0 ? path : this.tower.path), 8, DEPTH.hud + 1).onHover((on) => {
        const t = this.tower;
        if (!t) return;
        const p = t.tier === 0 ? path : t.path;
        const next = t.tier < 2 ? t.def.paths[p].tiers[t.tier as 0 | 1] : null;
        actions.hint(on && next ? `${PATH_LETTER[p]} ${t.def.paths[p].name}: ${next.name}. ${next.blurb}` : null);
      });
    this.pathBtns = [pathBtn(b0, 0), pathBtn(b1, 1)];
    this.sellBtn = rectButton(s, b2, '', () => this.tower && actions.sell(this.tower), 8, DEPTH.hud + 1);
    this.targetBtn = rectButton(s, b3, '', () => this.tower && actions.target(this.tower), 8, DEPTH.hud + 1);
    const close = rectButton(s, L.game.close, 'X', () => actions.close(), 10, DEPTH.hud + 1);
    this.root = s.add.container(side.x, side.y, [bg, this.name, this.tierText, this.icon, this.statsText, this.nextText]).setDepth(DEPTH.hud);
    this.buttons = [...this.pathBtns, this.sellBtn, this.targetBtn, close];
    this.show(null);
  }

  show(t: Tower | null) {
    this.tower = t;
    this.root.setVisible(!!t);
    for (const b of this.buttons) b.setVisible(!!t);
    if (!t) return;
    this.icon.removeAll(true);
    const { base, turret } = TowerView.make(this.scene, t.def, t.tier, t.path, 0, 0, 0, 2);
    this.icon.add(base);
    if (turret) this.icon.add(turret);
    this.targetBtn.setVisible(t.def.role === 'attack' && tierOf(t).projectile !== 'mine');
    this.refresh();
  }

  /** Re-read the tower (cash changes, upgrades, kills). */
  refresh() {
    const t = this.tower;
    if (!t) return;
    const tier = tierOf(t);
    this.name.setText(t.def.name);
    this.tierText.setText(`TIER ${t.tier + 1}/3${t.tier > 0 ? ` ${PATH_LETTER[t.path]}` : ''}\n${tier.name}`);
    this.statsText.setText(stats(t));
    if (t.tier === 0) {
      this.nextText.setText(`NEXT\nA ${t.def.paths[0].name}\nB ${t.def.paths[1].name}`);
      this.pathBtns.forEach((b, p) => {
        const cost = this.sim.upgradeCost(t, p as PathIndex)!;
        b.setVisible(true).setLabel(`PATH ${PATH_LETTER[p]}\n${cost}`).setEnabled(this.sim.cash >= cost);
      });
    } else {
      const next = t.tier < 2 ? t.def.paths[t.path].tiers[t.tier as 0 | 1] : null;
      this.nextText.setText(next ? `NEXT\n${next.name}` : `${PATH_LETTER[t.path]} ${t.def.paths[t.path].name}`);
      const cost = this.sim.upgradeCost(t);
      const [mine, other] = [this.pathBtns[t.path], this.pathBtns[1 - t.path]];
      other.setVisible(false);
      mine.setVisible(true);
      if (cost === null) mine.setLabel('MAX TIER').setEnabled(false);
      else mine.setLabel(`UPGRADE\n${cost}`).setEnabled(this.sim.cash >= cost);
    }
    this.sellBtn.setLabel(`SELL +${this.sim.sellValue(t)}`);
    this.targetBtn.setLabel(`TARGET\n${t.targeting.toUpperCase()}`);
  }
}
