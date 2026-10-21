import { emptyProgress, mergeProgress, sanitizeProgress, type Progress } from '../../../shared/progress';
import { Audio } from './Audio';
import { Music } from './Music';

const PROGRESS_KEY = 'ayatower.progress.v1';
const SESSION_KEY = 'ayatower.session.v1';

export interface Session {
  token: string;
  callsign: string;
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / storage full: progress still lives in memory and the cloud.
  }
}

class SaveSystem {
  progress: Progress = emptyProgress();
  session: Session | null = null;

  load() {
    this.progress = sanitizeProgress(read(PROGRESS_KEY));
    const s = read(SESSION_KEY) as Session | null;
    this.session = s && typeof s.token === 'string' && typeof s.callsign === 'string' ? s : null;
    Audio.setVolume(this.progress.settings.sfx);
    Music.setVolume(this.progress.settings.music);
  }

  persist() {
    write(PROGRESS_KEY, this.progress);
  }

  /** Fold in a change (or cloud copy) without ever lowering a stat. */
  merge(incoming: Progress) {
    this.progress = mergeProgress(this.progress, incoming);
    this.persist();
  }

  update(fn: (p: Progress) => void) {
    const next = structuredClone(this.progress);
    fn(next);
    this.merge(next);
  }

  setSession(s: Session | null) {
    this.session = s;
    write(SESSION_KEY, s);
  }
}

export const Save = new SaveSystem();
