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
    "destroyer": (64, 24, 9),
    "turret": (12, 12, 1),
    "boat_a": (16, 8, 2),
    "boat_b": (16, 8, 2),
    "artillery": (24, 24, 3),
    "battery": (24, 24, 3),
    "shell": (4, 4, 1),
    "shell_shadow": (6, 6, 1),
    "reticle": (16, 16, 2),
    "round": (6, 3, 1),
    "splash": (16, 16, 4),
    "explosion_sm": (16, 16, 6),
    "explosion_lg": (32, 32, 6),
    "smoke": (8, 8, 4),
    "mine": (12, 12, 2),
    "drone": (20, 12, 2),
    "missile": (16, 6, 2),
    "boss": (48, 20, 3),
    "pickup": (12, 12, 2),
    "potus": (64, 64, 5),
    "ui_panel": (48, 48, 1),
    "hud_icons": (16, 16, 10),
    "tiles": (16, 16, 23),
    "title_logo": (232, 104, 1),
    "advisory": (48, 32, 1),
    "lowrider": (24, 12, 10),
    "guests": (64, 64, 8),
    "mic": (12, 12, 2),
}
OPAQUE = {"tiles", "potus", "title_logo", "advisory", "guests"}


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
        marker = os.path.join(out, "turret.png")
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
