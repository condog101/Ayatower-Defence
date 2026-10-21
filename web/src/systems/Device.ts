/**
 * Touch UI switch, decided once at load: phones and tablets report a coarse pointer.
 * `?touch=1` / `?touch=0` overrides it (test the touch UI on desktop, or opt out on a tablet with a mouse).
 */
function detectTouch(): boolean {
  const flag = new URLSearchParams(location.search).get('touch');
  if (flag === '1') return true;
  if (flag === '0') return false;
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}

export const TOUCH: boolean = detectTouch();

/** Pick the hint wording for the current input scheme. */
export function byInput<T>(desktop: T, touch: T): T {
  return TOUCH ? touch : desktop;
}
