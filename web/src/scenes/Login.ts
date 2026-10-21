import Phaser from 'phaser';
import { sanitizeProgress } from '../../../shared/progress';
import { CX, HEIGHT, OX, PX, WIDTH } from '../data/balance';
import { api, ApiError } from '../net/api';
import { syncProgress } from '../net/sync';
import { TOUCH } from '../systems/Device';
import { Save } from '../systems/Save';
import { COLORS, designFrame, panel, text } from '../systems/UI';

/**
 * Callsign + PIN form. Phaser has no text input, so this drives an HTML form
 * (#login in index.html) laid over the canvas.
 */
export class LoginScene extends Phaser.Scene {
  constructor() {
    super('Login');
  }

  create() {
    designFrame(this);
    this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'tiles', 0).setOrigin(0).setTileScale(PX).setScrollFactor(0).setAlpha(0.4);
    // On phones the form is its own card (heading included); on desktop it sits inside this panel.
    if (!TOUCH) {
      panel(this, OX + 220, 60, 520, 420);
      text(this, CX, 100, 'JOIN THE GUARD', 24, COLORS.gold);
    }

    const form = document.getElementById('login') as HTMLFormElement;
    const callsign = form.querySelector<HTMLInputElement>('[name=callsign]')!;
    const pin = form.querySelector<HTMLInputElement>('[name=pin]')!;
    const msg = form.querySelector<HTMLElement>('.msg')!;
    const cancel = form.querySelector<HTMLButtonElement>('[data-action=cancel]')!;
    form.hidden = false;
    form.classList.toggle('touch', TOUCH);
    msg.textContent = 'New recruit? Pick a callsign and a 4-digit PIN, then REGISTER. Already in the Guard? SIGN IN with the same PIN.';
    msg.className = 'msg';
    callsign.value = '';
    pin.value = '';
    // Keep Phaser from eating keystrokes meant for the inputs.
    this.input.keyboard!.enabled = false;
    this.input.keyboard!.disableGlobalCapture();
    setTimeout(() => callsign.focus(), 50);

    let busy = false;
    const close = (toTitle = true) => {
      form.hidden = true;
      form.onsubmit = null;
      cancel.onclick = null;
      this.input.keyboard!.enabled = true;
      this.input.keyboard!.enableGlobalCapture();
      if (toTitle) this.scene.start('Title');
    };

    const submit = async (mode: 'login' | 'register') => {
      if (busy) return;
      busy = true;
      msg.className = 'msg';
      msg.textContent = mode === 'login' ? 'Checking your papers...' : 'Swearing you in...';
      try {
        const res = await (mode === 'login' ? api.login : api.register)(callsign.value.trim(), pin.value);
        Save.setSession({ token: res.token, callsign: res.profile.callsign });
        Save.merge(sanitizeProgress(res.profile.progress));
        await syncProgress();
        close();
      } catch (e) {
        msg.className = 'msg error';
        msg.textContent = e instanceof ApiError ? e.message : 'Something went wrong.';
      } finally {
        busy = false;
      }
    };

    form.onsubmit = (ev) => {
      ev.preventDefault();
      const which = (ev.submitter as HTMLButtonElement | null)?.dataset.action === 'register' ? 'register' : 'login';
      void submit(which);
    };
    cancel.onclick = () => close();
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && !form.hidden) close();
    };
    window.addEventListener('keydown', onEsc);
    // Keep the card in view while the soft keyboard pans the visual viewport.
    const vv = window.visualViewport;
    const follow = () => {
      if (vv && TOUCH) form.style.top = `${vv.offsetTop + 6}px`;
    };
    vv?.addEventListener('resize', follow);
    vv?.addEventListener('scroll', follow);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', onEsc);
      vv?.removeEventListener('resize', follow);
      vv?.removeEventListener('scroll', follow);
      form.style.top = '';
      if (!form.hidden) close(false);
    });
  }
}
