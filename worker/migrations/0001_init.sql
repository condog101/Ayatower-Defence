-- Hormuz Run: players, sessions, leaderboard runs, login rate limiting.

CREATE TABLE players (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  callsign      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  pin_hash      TEXT    NOT NULL,
  salt          TEXT    NOT NULL,
  progress_json TEXT    NOT NULL,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT    PRIMARY KEY,
  player_id  INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_player ON sessions(player_id);

CREATE TABLE runs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id     INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  score         INTEGER NOT NULL,
  start_level   INTEGER NOT NULL DEFAULT 1,
  level_reached INTEGER NOT NULL,
  duration_ms   INTEGER NOT NULL,
  kills         INTEGER NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_runs_score ON runs(score DESC);
CREATE INDEX idx_runs_player_score ON runs(player_id, score DESC);

CREATE TABLE login_attempts (
  key          TEXT    PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
