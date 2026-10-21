#!/usr/bin/env python3
"""Apply tune.ts output (JSON on stdin) to the rush() counts in levels_src.py, then re-emit."""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(HERE, 'levels_src.py')
s = open(p).read()
data = json.load(sys.stdin)
for n, entry in data.items():
    n = int(n)
    waves = entry['waves'] if isinstance(entry, dict) else entry
    if isinstance(entry, dict):
        blk0 = s.index(f"    {n}: dict(")
        end0 = s.index("brief=", blk0)
        s = s[:blk0] + re.sub(r"cash=\d+", f"cash={entry['cash']}", s[blk0:end0]) + s[end0:]
    blk = s.index(f"    {n}: dict(")
    w0 = s.index("waves=waves(", blk) + len("waves=waves(\n")
    w1 = s.index("        ),\n    ),", w0)
    lines = [l for l in s[w0:w1].split('\n') if l.strip()]
    assert len(lines) == len(waves), (n, len(lines), len(waves))
    new = []
    for line, counts in zip(lines, waves):
        it = iter(counts)
        new.append(re.sub(r"rush\('(\w+)', (\d+), ", lambda m: f"rush('{m.group(1)}', {next(it)}, ", line))
    s = s[:w0] + '\n'.join(new) + '\n' + s[w1:]
open(p, 'w').write(s)
