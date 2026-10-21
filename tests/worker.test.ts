import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

let ipCounter = 0;
const freshIp = () => `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;
let nameCounter = 0;
const freshName = (prefix = 'Sailor') => `${prefix}_${++nameCounter}`;

interface CallOpts {
  method?: string;
  body?: unknown;
  token?: string;
  ip?: string;
  headers?: Record<string, string>;
}

async function call(path: string, opts: CallOpts = {}) {
  const headers: Record<string, string> = { 'cf-connecting-ip': opts.ip ?? freshIp(), ...opts.headers };
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  const res = await SELF.fetch(`https://ayatower.test${path}`, {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body === undefined ? undefined : typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body),
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, headers: res.headers };
}

async function register(callsign = freshName(), pin = '1234') {
  const r = await call('/api/register', { body: { callsign, pin } });
  expect(r.status).toBe(200);
  return { callsign, pin, token: r.data.token as string, profile: r.data.profile };
}

const validRun = (score: number) => ({ score, startLevel: 1, levelReached: 2, durationMs: 120_000, kills: 20 });

describe('auth', () => {
  it('register → login → me', async () => {
    const reg = await register('Maverick', '0042');
    expect(reg.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(reg.profile.callsign).toBe('Maverick');
    expect(reg.profile.progress.highestLevel).toBe(1);

    const login = await call('/api/login', { body: { callsign: 'maverick', pin: '0042' } });
    expect(login.status).toBe(200);
    expect(login.data.token).not.toBe(reg.token);

    const me = await call('/api/me', { token: login.data.token });
    expect(me.status).toBe(200);
    expect(me.data.callsign).toBe('Maverick');
    expect(me.headers.get('cache-control')).toBe('no-store');
    expect(me.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('trims callsigns', async () => {
    const r = await call('/api/register', { body: { callsign: '  Goose 2  ', pin: '1111' } });
    expect(r.status).toBe(200);
    expect(r.data.profile.callsign).toBe('Goose 2');
  });

  it('rejects duplicate callsigns case-insensitively', async () => {
    await register('IceMan', '1111');
    const dup = await call('/api/register', { body: { callsign: 'iceman', pin: '2222' } });
    expect(dup.status).toBe(409);
  });

  it('rejects a bad PIN and an unknown callsign with the same message', async () => {
    await register('Viper', '1234');
    const bad = await call('/api/login', { body: { callsign: 'Viper', pin: '9999' } });
    const unknown = await call('/api/login', { body: { callsign: 'Nobody Here', pin: '9999' } });
    expect(bad.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(bad.data.error).toBe(unknown.data.error);
  });

  it('validates callsign and PIN', async () => {
    const cases = [
      { callsign: 'ab', pin: '1234' },
      { callsign: 'x'.repeat(17), pin: '1234' },
      { callsign: 'bad!name', pin: '1234' },
      { callsign: 'two  spaces', pin: '1234' },
      { callsign: 42, pin: '1234' },
      { callsign: 'Okay Name', pin: '123' },
      { callsign: 'Okay Name', pin: '12345' },
      { callsign: 'Okay Name', pin: 1234 },
      { callsign: 'Okay Name', pin: 'abcd' },
    ];
    for (const body of cases) {
      const r = await call('/api/register', { body });
      expect(r.status, JSON.stringify(body)).toBe(400);
    }
  });

  it('rate limits login per callsign after 5 failures', async () => {
    await register('Jester', '1234');
    for (let i = 0; i < 5; i++) {
      expect((await call('/api/login', { body: { callsign: 'Jester', pin: '0000' } })).status).toBe(401);
    }
    const blocked = await call('/api/login', { body: { callsign: 'jester', pin: '1234' } });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('rate limits login per IP across callsigns', async () => {
    const ip = '203.0.113.7';
    const target = await register(freshName('Target'));
    for (let i = 0; i < 5; i++) {
      await call('/api/login', { ip, body: { callsign: freshName('Guess'), pin: '0000' } });
    }
    const blocked = await call('/api/login', { ip, body: { callsign: target.callsign, pin: target.pin } });
    expect(blocked.status).toBe(429);
    // Same callsign from another IP still works.
    expect((await call('/api/login', { body: { callsign: target.callsign, pin: target.pin } })).status).toBe(200);
  });

  it('a successful login resets the callsign counter', async () => {
    const p = await register(freshName('Reset'));
    for (let i = 0; i < 4; i++) await call('/api/login', { body: { callsign: p.callsign, pin: '0000' } });
    expect((await call('/api/login', { body: { callsign: p.callsign, pin: p.pin } })).status).toBe(200);
    for (let i = 0; i < 4; i++) {
      expect((await call('/api/login', { body: { callsign: p.callsign, pin: '0000' } })).status).toBe(401);
    }
  });

  it('rate limits registration per IP', async () => {
    const ip = '198.51.100.9';
    for (let i = 0; i < 5; i++) {
      expect((await call('/api/register', { ip, body: { callsign: freshName('Reg'), pin: '1234' } })).status).toBe(200);
    }
    expect((await call('/api/register', { ip, body: { callsign: freshName('Reg'), pin: '1234' } })).status).toBe(429);
  });

  it('requires auth', async () => {
    expect((await call('/api/me')).status).toBe(401);
    expect((await call('/api/me', { token: 'A'.repeat(43) })).status).toBe(401);
    expect((await call('/api/me', { headers: { authorization: 'Basic abc' } })).status).toBe(401);
    expect((await call('/api/me/progress', { method: 'PUT', body: {} })).status).toBe(401);
    expect((await call('/api/runs', { body: validRun(100) })).status).toBe(401);
    expect((await call('/api/logout', { body: {} })).status).toBe(401);
  });

  it('logout invalidates the token', async () => {
    const p = await register();
    expect((await call('/api/logout', { method: 'POST', token: p.token })).status).toBe(200);
    expect((await call('/api/me', { token: p.token })).status).toBe(401);
  });
});

describe('progress', () => {
  it('merges and never regresses', async () => {
    const p = await register();
    const first = await call('/api/me/progress', {
      method: 'PUT',
      token: p.token,
      body: { highestLevel: 4, levelBest: { '1': 5000, '2': 3000 }, bestRun: 8000, settings: { sfx: 0.2, shake: true } },
    });
    expect(first.status).toBe(200);
    expect(first.data.progress.highestLevel).toBe(4);

    const second = await call('/api/me/progress', {
      method: 'PUT',
      token: p.token,
      body: { highestLevel: 2, levelBest: { '1': 100, '3': 2500 }, bestRun: 10, settings: { sfx: 1, shake: false } },
    });
    expect(second.data.progress).toMatchObject({
      highestLevel: 4,
      levelBest: { '1': 5000, '2': 3000, '3': 2500 },
      bestRun: 8000,
      settings: { sfx: 1, shake: false },
    });

    const me = await call('/api/me', { token: p.token });
    expect(me.data.progress).toEqual(second.data.progress);
  });

  it('sanitizes hostile progress', async () => {
    const p = await register();
    const r = await call('/api/me/progress', {
      method: 'PUT',
      token: p.token,
      body: { highestLevel: 1e9, levelBest: { '999': 5 }, bestRun: 'lots' },
    });
    expect(r.status).toBe(200);
    expect(r.data.progress.highestLevel).toBe(10);
    expect(r.data.progress.levelBest).toEqual({});
    expect(r.data.progress.bestRun).toBe(0);
  });
});

describe('runs and leaderboard', () => {
  it('rejects implausible runs', async () => {
    const p = await register();
    const forged = await call('/api/runs', { token: p.token, body: { ...validRun(0), score: 99_999_999 } });
    expect(forged.status).toBe(400);
    expect(forged.data.accepted).toBe(false);
    const tooFast = await call('/api/runs', {
      token: p.token,
      body: { score: 100, startLevel: 1, levelReached: 9, durationMs: 1000, kills: 1 },
    });
    expect(tooFast.status).toBe(400);
    const missing = await call('/api/runs', { token: p.token, body: { score: 100 } });
    expect(missing.status).toBe(400);
  });

  it('accepts runs, defaults startLevel, updates bestRun and orders the leaderboard by best per player', async () => {
    const a = await register('LB Alpha');
    const b = await register('LB Bravo');
    const c = await register('LB Charlie');

    const { startLevel: _omit, ...noStart } = validRun(3000);
    const r1 = await call('/api/runs', { token: a.token, body: noStart });
    expect(r1.status).toBe(200);
    expect(r1.data.accepted).toBe(true);

    expect((await call('/api/runs', { token: a.token, body: validRun(9000) })).status).toBe(200);
    expect((await call('/api/runs', { token: b.token, body: validRun(6000) })).status).toBe(200);
    const cRun = await call('/api/runs', { token: c.token, body: validRun(7000) });
    expect(cRun.data.rank).toBe(2);

    // There is no endless mode: level 11 runs are rejected.
    const endless = await call('/api/runs', {
      token: b.token,
      body: { score: 5000, startLevel: 11, levelReached: 11, durationMs: 60_000, kills: 30 },
    });
    expect(endless.status).toBe(400);

    const me = await call('/api/me', { token: a.token });
    expect(me.data.progress.bestRun).toBe(9000);
    const meB = await call('/api/me', { token: b.token });
    expect(meB.data.progress.bestRun).toBe(6000);
    expect(meB.data.progress.endlessBest).toBe(0);

    const lb = await call('/api/leaderboard?limit=50');
    expect(lb.status).toBe(200);
    const ours = (lb.data as any[]).filter((e) => e.callsign.startsWith('LB '));
    expect(ours.map((e) => [e.callsign, e.score])).toEqual([
      ['LB Alpha', 9000],
      ['LB Charlie', 7000],
      ['LB Bravo', 6000],
    ]);
    expect(ours[0]).toMatchObject({ startLevel: 1, levelReached: 2 });
    expect(typeof ours[0].at).toBe('string');
    for (let i = 1; i < lb.data.length; i++) expect(lb.data[i - 1].score).toBeGreaterThanOrEqual(lb.data[i].score);
  });

  it('caps leaderboard limit', async () => {
    const r = await call('/api/leaderboard?limit=1000');
    expect(r.status).toBe(200);
    expect(r.data.length).toBeLessThanOrEqual(50);
    expect((await call('/api/leaderboard?limit=abc')).status).toBe(200);
  });
});

describe('routing and hygiene', () => {
  it('404s unknown API routes and 405s wrong methods', async () => {
    expect((await call('/api/nope')).status).toBe(404);
    const r = await call('/api/leaderboard', { method: 'DELETE' });
    expect(r.status).toBe(405);
    expect((await call('/api/login')).status).toBe(405);
  });

  it('400s malformed JSON and 413s oversized bodies', async () => {
    expect((await call('/api/login', { body: '{not json' })).status).toBe(400);
    expect((await call('/api/login', { body: '[1,2]' })).status).toBe(400);
    const big = JSON.stringify({ callsign: 'Big Body', pin: '1234', pad: 'x'.repeat(10_000) });
    expect((await call('/api/register', { body: big })).status).toBe(413);
  });

  it('reflects only allowed CORS origins and answers preflight', async () => {
    const dev = await call('/api/leaderboard', { headers: { origin: 'http://localhost:5173' } });
    expect(dev.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    const evil = await call('/api/leaderboard', { headers: { origin: 'https://evil.example' } });
    expect(evil.headers.get('access-control-allow-origin')).toBeNull();
    const pre = await call('/api/login', { method: 'OPTIONS', headers: { origin: 'http://127.0.0.1:5173' } });
    expect(pre.status).toBe(204);
    expect(pre.headers.get('access-control-allow-methods')).toContain('POST');
  });
});
