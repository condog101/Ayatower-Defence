/**
 * One-time "Add to Home Screen" nudge for iOS Safari: launched from the Home Screen the game runs
 * standalone, without Safari's bars eating the short side of a landscape phone.
 * Other browsers either install on their own or can't, so they never see it.
 */
const KEY = 'ayatower.installHint';

function isIOS(): boolean {
  // iPadOS reports itself as a Mac; touch points give it away.
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (navigator as { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
}

function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function showInstallHint(): void {
  const el = document.getElementById('install');
  if (!el || !isIOS() || isStandalone() || seen()) return;
  el.hidden = false;
  const dismiss = () => {
    el.hidden = true;
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // private mode: it'll just show again next visit
    }
  };
  el.addEventListener('pointerup', dismiss, { once: true });
  // Out of the way once they start playing.
  setTimeout(dismiss, 15000);
}
