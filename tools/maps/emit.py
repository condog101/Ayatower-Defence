#!/usr/bin/env python3
"""Write web/src/data/maps/levelNN.ts from paint.py's map plus the header and waves below.

    python3 tools/maps/emit.py 2 3 4    # rewrite those level files
Waves are kept here as TS source so the level file reads as one line per wave.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from paint import LEVELS, ts  # noqa: E402

OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'web', 'src', 'data', 'maps'))
from levels_src import META  # noqa: E402


def emit(n):
    k, lanes, air = LEVELS[n]()
    m = META[n]
    uses_boss = 'boss(' in m['waves']
    imports = 'boss, rush, wave' if uses_boss else 'rush, wave'
    boss_line = f"\n  bossName: '{m['bossName']}'," if m.get('bossName') else ''
    air_line = f"\n  airLane: {air}," if air is not None else ''
    src = f"""import type {{ LevelDef }} from '../../sim/types';
import {{ {imports} }} from './recipes';

export const LEVEL_{n:02d}: LevelDef = {{
  n: {n},
  name: '{m['name']}',
  sub: '{m['sub']}',
  brief: {m['brief']!r},
{ts(k.rows())}
  lanes: [{', '.join('[' + ', '.join(f'[{c}, {r}]' for c, r in l) + ']' for l in lanes)}],{air_line}
  startCash: {m['cash']},
  lives: 100,
  towers: [{', '.join(repr(t) for t in m['towers'])}],
  waves: [
{m['waves'].strip(chr(10))}
  ],{boss_line}
  seed: {1000 + n},
}};
"""
    path = os.path.join(OUT, f'level{n:02d}.ts')
    with open(path, 'w') as f:
        f.write(src)
    print('wrote', path)


if __name__ == '__main__':
    for a in sys.argv[1:]:
        emit(int(a))
