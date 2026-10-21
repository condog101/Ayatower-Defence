import Phaser from 'phaser';
import { L, setLayout } from '../data/balance';
import { computeLayout, type Insets, type Layout } from '../layout/compute';
import { TOUCH } from './Device';

export const LAYOUT_CHANGED = 'layout:changed';

/** Safe-area insets in CSS px, from the --sa* custom properties in index.html; `?safe=N` fakes a notch. */
function insets(): Insets {
  const fake = Number(new URLSearchParams(location.search).get('safe'));
  if (fake > 0) return { top: 0, right: fake, bottom: 21, left: fake };
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => parseFloat(css.getPropertyValue(name)) || 0;
  return { top: v('--sat'), right: v('--sar'), bottom: v('--sab'), left: v('--sal') };
}

/** Measure the viewport and install the layout. */
export function measure(): Layout {
  const el = document.getElementById('game');
  const w = el?.clientWidth || window.innerWidth;
  const h = el?.clientHeight || window.innerHeight;
  const next = computeLayout(w, h, insets(), TOUCH);
  setLayout(next);
  return next;
}

const same = (a: Layout, b: Layout) =>
  a.W === b.W && a.H === b.H && a.map.x === b.map.x && a.map.y === b.map.y && a.left.w === b.left.w && a.right.w === b.right.w;

/**
 * Re-measure on rotation, fullscreen and viewport changes (debounced). When the layout changes the
 * canvas is resized to it and LAYOUT_CHANGED is emitted on game.events for scenes to rebuild.
 */
export function watch(game: Phaser.Game) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const check = () => {
    timer = null;
    const before = L;
    const next = measure();
    if (same(before, next)) return;
    game.scale.resize(next.W, next.H);
    game.events.emit(LAYOUT_CHANGED);
  };
  const soon = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(check, 150);
  };
  window.visualViewport?.addEventListener('resize', soon);
  window.addEventListener('resize', soon);
  window.addEventListener('orientationchange', soon);
  document.addEventListener('fullscreenchange', soon);
}
