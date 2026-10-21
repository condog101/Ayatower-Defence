#!/usr/bin/env python3
"""Generate the game's pixel-art sprite sheets.

    python3 tools/sprites/gen.py                 # write sheets that don't exist yet
    python3 tools/sprites/gen.py --force boat_a  # regenerate specific sheets
    python3 tools/sprites/gen.py --all           # regenerate everything
    python3 tools/sprites/gen.py --list          # show sheet names and sizes

Existing files are skipped by default so hand edits made in LibreSprite survive.
Every sheet is one horizontal strip of equal frames (frame i at x = i * width).
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from sheets import SHEETS  # noqa: E402

DEFAULT_OUT = os.path.normpath(os.path.join(HERE, "..", "..", "web", "public", "assets", "sprites"))


def build_sheet(mod):
    img = mod.build()
    fw, fh = mod.FRAME
    expected = (fw * mod.FRAMES, fh)
    if img.size != expected:
        raise SystemExit(f"{mod.NAME}: built {img.size}, expected {expected}")
    return img


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=DEFAULT_OUT, help="output directory (default: web/public/assets/sprites)")
    ap.add_argument("--force", nargs="+", metavar="NAME", default=[], help="regenerate these sheets even if present")
    ap.add_argument("--all", action="store_true", help="regenerate every sheet")
    ap.add_argument("--list", action="store_true", help="list sheets and exit")
    args = ap.parse_args(argv)

    by_name = {m.NAME: m for m in SHEETS}
    if args.list:
        for m in SHEETS:
            fw, fh = m.FRAME
            print(f"{m.NAME:14s} frame {fw}x{fh}  x{m.FRAMES}  -> {fw * m.FRAMES}x{fh}")
        return 0

    unknown = [n for n in args.force if n not in by_name]
    if unknown:
        ap.error(f"unknown sheet(s): {', '.join(unknown)} (see --list)")

    os.makedirs(args.out, exist_ok=True)
    wrote = skipped = 0
    for m in SHEETS:
        path = os.path.join(args.out, f"{m.NAME}.png")
        if os.path.exists(path) and not args.all and m.NAME not in args.force:
            skipped += 1
            continue
        build_sheet(m).save(path, optimize=True)
        print(f"wrote {path}")
        wrote += 1
    print(f"{wrote} written, {skipped} skipped (existing; use --force NAME or --all to regenerate)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
