# Ayatower Defence: You Shah-ll not pass!

A satirical tower defence in the Strait of Hormuz. The Ayatollah is Gandalf (the **Ayatower**, the
Grey Turban), the US Navy is Sauron's host, and **Big Don**, the Eye of Mordor-a-Lago, wants his
fleet through. Place towers loosely based on Iran's coastal arsenal (speedboats, mines, drone boats,
AA guns, Shahed drones, coastal missiles, midget subs, radar, jammers, SAMs, a propaganda minaret) to
stop ships and aircraft sailing the lanes to your tower. Ten levels (some with two lanes or a separate air corridor), two bosses, a chiptune score, phone-first layout.

Live: https://ayatower-defence.hormuz-run.workers.dev

Everything in it is fictional satire: Big Don is a parody of Donald Trump and the Grey Turban a
caricature of an Ayatollah; no line is a real quote and the Tolkien nods are parodies. Ship, plane
and weapon stats are game numbers, not real capabilities. Swearing is always bleeped.

## How it plays

- **Layout**: the map sits in the middle; START WAVE, speed, AUTO, PAUSE and the two abilities are
  in the left strip, the shop (or the selected tower) in the right strip, the ticker and hints under
  the map. The canvas always takes the screen's exact shape, notch and all.
- **Build**: pick a card in the shop (click it, or drag it onto the map on touch) and drop it on a
  hatched cell. Land towers go on land, sea towers (mines, martyr boats, Ghadir subs) in the shallows.
- **Waves**: START WAVE (Space). Sink ships for RIALS; every ship that reaches the Ayatower costs
  PATIENCE (lives). Ships alternate between a level's lanes. Send the next wave early once the
  current one has finished spawning. F cycles 1x/2x/3x, A toggles AUTO, P/Esc pauses.
- **Upgrade**: click a tower for its panel: three tiers each, sell for 70%, cycle targeting
  (FIRST / LAST / STRONG / CLOSE). Keys U / X / T.
- **Rules worth knowing**: armour ignores bullets; aircraft can only be hit by the AA pit and the SAM;
  stealth (submarines, the B-2) can't be targeted until a radar (or, for subs, a Ghadir) sees it,
  though mines always hit. Support towers' buffs never stack: each takes the best one covering it.
- **Abilities**: YOU SHAH-LL NOT PASS! (key 1, from level 1) stuns everything near the tap; FATWA
  (key 2, from level 6) marks one ship for +50% damage and makes every tower target it.

Score per level = kills + wave rewards + 1000 x level + 50 per PATIENCE left + 1500 if nothing passed.
Players who SWEAR THE OATH (a name + 4-digit PIN) sync progress and are written into THE ANNALS (the leaderboard).

## Run locally

Node 22 via fnm (the system node is older):

```bash
export PATH="$HOME/.local/share/fnm:$PATH"; eval "$(fnm env --shell bash)"
npm install
npm run db:migrate:local
npm run dev            # vite on :5173 (proxying /api) + wrangler dev on :8787
```

`?touch=1` forces the touch UI on desktop (`?touch=0` the reverse). A throwaway account for the
local dev database lives in `tests/fixtures/dev-players.json`.

## Tests

```bash
npm test               # vitest inside workerd: worker API, scoring, sim, levels, towers, dialogue
npm run test:py        # sprite generator contract
```

The headless suite includes a balance harness: `tests/fixtures/builds.ts` holds one plausible,
unoptimised build per level (towers on auto-chosen spots that spread across lanes), and
`tests/levels.test.ts` replays each one deterministically and requires it to win while losing a
set share of PATIENCE (5-15 on level 1 up to 20-60 on level 10), and doing nothing to lose. For tuning:

```bash
npx esbuild tools/balance.ts --bundle --platform=node --format=esm --outfile=/tmp/b.mjs && VERBOSE=1 node /tmp/b.mjs 7
```

`tools/tune.ts` + `tools/maps/apply_counts.py` can shrink wave counts that cost the canned build too
many lives. `tests/waves.test.ts` regenerates the per-level plausibility tables pasted into
`shared/scoring.ts` and prints the right values when a level changes.

## Levels and maps

Maps are 25x16 cells of ASCII (`~` water, `=` lane, `,` shallows, `.` land, `#` rock, `P T M O`
decor, `A` the Ayatower), with one to three lanes. They are painted in `tools/maps/paint.py`, which
stamps the lanes from the same waypoints the sim uses, keeps a water margin round them and thins
the land in range of the lanes so good spots stay scarce (`tools/maps/metrics.py` reports it).
`tools/maps/emit.py` writes `web/src/data/maps/levelNN.ts` from the map plus the header and wave
tables in `tools/maps/levels_src.py`.

## Music

`web/src/systems/music/`: a note-string notation (`notation.ts`), raw-oscillator voices (`voices.ts`)
and six original songs (`songs.ts`: title, build, wave, boss, and the clear and defeat stingers),
played by the scheduler in `Music.ts`. `tests/music.test.ts` checks every song parses, fills its bars
and stays in its mode.

## Sprites

```bash
npm run sprites                                   # writes sheets that don't exist yet
python3 tools/sprites/gen.py --force towers       # regenerate one
```

Pillow generators in `tools/sprites/sheets/`; existing PNGs are never overwritten without `--force`,
so LibreSprite touch-ups survive. `test_gen.py` EXPECTED, `sheets/__init__.py` SHEETS and
`web/src/scenes/Boot.ts` SHEETS must change together.

## Deploy (Cloudflare Workers + D1)

```bash
npm run db:migrate:remote
npm run deploy
```

Static assets and the `/api/*` Worker share one deployment; D1 (`ayatower-db`) holds players,
sessions, runs and rate limits.

## Layout

```
shared/            progress merge + scoring/plausibility (client and Worker)
worker/            the API: register, login, progress sync, runs, leaderboard
web/src/sim/       the deterministic 60 Hz simulation (no Phaser, no DOM; tested in workerd)
web/src/layout/    the pure screen-layout calculator (tests/layout.test.ts checks 15 viewports)
web/src/data/      towers, enemies, levels and maps, quotes, story; balance.ts holds the live layout
web/src/game/      map, enemy/tower/projectile views, HUD, shop, tower panel, abilities, input, dialogue
web/src/scenes/    Boot, Title, Login, Briefing, LevelIntro, Game, LevelClear, GameOver, Leaderboard
tools/             sprite generator, map painter, balance + tuning scripts
tests/             vitest suites and fixtures
```
