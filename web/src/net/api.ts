import type { Progress } from '../../../shared/progress';
import type { RunSubmission } from '../../../shared/scoring';
import { Save } from '../systems/Save';

export interface Profile {
  callsign: string;
  progress: Progress;
  createdAt: string;
}

export interface LeaderboardRow {
  callsign: string;
  score: number;
  levelReached: number;
  startLevel?: number;
  at: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  const token = Save.session?.token;
  if (token) headers.authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Offline: could not reach base.');
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    if (res.status === 401 && token) Save.setSession(null);
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  register: (callsign: string, pin: string) =>
    call<{ token: string; profile: Profile }>('POST', '/register', { callsign, pin }),
  login: (callsign: string, pin: string) =>
    call<{ token: string; profile: Profile }>('POST', '/login', { callsign, pin }),
  logout: () => call<{ ok: true }>('POST', '/logout'),
  me: () => call<Profile>('GET', '/me'),
  putProgress: (p: Progress) => call<Profile>('PUT', '/me/progress', p),
  submitRun: (run: RunSubmission) => call<{ rank: number; accepted: boolean }>('POST', '/runs', run),
  leaderboard: (limit = 20) => call<LeaderboardRow[]>('GET', `/leaderboard?limit=${limit}`),
};
