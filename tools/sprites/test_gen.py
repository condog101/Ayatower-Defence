#!/usr/bin/env python3
"""Regenerate every sheet into a temp dir and check the exact sizes the game expects.

    python3 tools/sprites/test_gen.py
"""
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from PIL import Image  # noqa: E402

import gen  # noqa: E402

# name -> (frame_w, frame_h, frames). This is the contract with web/src; change both together.
EXPECTED = {
    "tiles": (16, 16, 44),
    "decor": (16, 16, 6),
    "beacon": (16, 16, 4),
    "towers": (32, 32, 55),
    "turrets": (32, 32, 160),
    "ayatower": (32, 32, 4),
    "rhib": (12, 6, 2),
    "patrol": (16, 8, 2),
    "cyclone": (20, 8, 2),
    "lcs": (24, 10, 2),
    "frigate": (28, 10, 2),
    "burke": (32, 10, 2),
    "sub": (24, 8, 4),
    "tico": (36, 12, 2),
    "lhd": (48, 16, 2),
    "carrier": (64, 20, 2),
    "zumwalt": (36, 10, 2),
    "lcac": (20, 10, 2),
    "ohio": (32, 8, 4),
    "boss_yacht": (48, 14, 2),
    "boss_don": (80, 24, 2),
    "boss_af1": (40, 28, 2),
    "boss_resort": (72, 28, 2),
    "reaper": (16, 12, 2),
    "seahawk": (16, 12, 2),
    "hornet": (16, 12, 2),
    "b2": (24, 12, 2),
    "f35": (16, 12, 2),
    "p_bullet": (4, 4, 1),
    "p_rocket": (6, 3, 2),
    "p_missile": (8, 3, 2),
    "p_shahed": (8, 6, 2),
    "p_torpedo": (8, 3, 2),
    "p_mine": (6, 6, 2),
    "p_boat": (10, 5, 2),
    "p_sam": (8, 3, 2),
    "muzzle": (6, 6, 2),
    "explosion_sm": (16, 16, 6),
    "explosion_lg": (32, 32, 6),
    "splash": (16, 16, 4),
    "smoke": (8, 8, 4),
    "stun": (8, 8, 2),
    "jam": (16, 16, 2),
    "ring": (24, 24, 1),
    "coin": (8, 8, 1),
    "don": (64, 64, 5),
    "aya": (64, 64, 5),
    "title_logo": (288, 96, 1),
    "hud_icons": (12, 12, 17),
    "ui_panel": (48, 48, 1),
    "button": (48, 48, 1),
    "palantir": (48, 48, 1),
    "scroll": (48, 48, 1),
    "seal": (48, 48, 1),
}
OPAQUE = {"tiles", "don", "aya", "title_logo"}


def main():
    failures = []
    with tempfile.TemporaryDirectory() as out:
        gen.main(["--all", "--out", out])
        produced = {f[:-4] for f in os.listdir(out) if f.endswith(".png")}
        for name in sorted(set(EXPECTED) - produced):
            failures.append(f"missing sheet: {name}.png")
        for name in sorted(produced - set(EXPECTED)):
            failures.append(f"unexpected sheet: {name}.png")
        for name, (fw, fh, n) in EXPECTED.items():
            path = os.path.join(out, f"{name}.png")
            if not os.path.exists(path):
                continue
            img = Image.open(path)
            if img.mode != "RGBA":
                failures.append(f"{name}: mode {img.mode}, expected RGBA")
            if img.size != (fw * n, fh):
                failures.append(f"{name}: size {img.size}, expected {(fw * n, fh)}")
                continue
            alpha = img.getchannel("A")
            for i in range(n):
                lo, hi = alpha.crop((i * fw, 0, (i + 1) * fw, fh)).getextrema()
                if hi == 0:
                    failures.append(f"{name}: frame {i} is empty")
                if name in OPAQUE and lo != 255:
                    failures.append(f"{name}: frame {i} has transparent pixels")
            if name not in OPAQUE and alpha.getextrema()[0] != 0:
                failures.append(f"{name}: expected a transparent background")
        # skip-existing behaviour: a second plain run must not overwrite anything
        marker = os.path.join(out, "coin.png")
        before = os.path.getmtime(marker)
        os.utime(marker, (before - 100, before - 100))
        gen.main(["--out", out])
        if os.path.getmtime(marker) != before - 100:
            failures.append("plain run overwrote an existing sheet")

    if failures:
        print("FAIL")
        for f in failures:
            print("  -", f)
        return 1
    print(f"OK: {len(EXPECTED)} sheets with expected dimensions")
    return 0


if __name__ == "__main__":
    sys.exit(main())
