/** State carried across scenes for one campaign run. Lives and cash live in the Sim, per level. */
export interface RunState {
  mode: 'campaign';
  startLevel: number;
  level: number;
  score: number;
  kills: number;
  leaks: number;
  playMs: number;
  /** One-off dialogue already used this run (first build of each tower, first aircraft, ...). */
  said: string[];
}

export function newRun(startLevel: number): RunState {
  return { mode: 'campaign', startLevel, level: startLevel, score: 0, kills: 0, leaks: 0, playMs: 0, said: [] };
}
