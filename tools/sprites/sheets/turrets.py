"""Aimed turret tops, 16x16 transparent, centred on the frame so they overlay the tower base.

frame = ((aimedIndex * 3 + tier) * 8) + dir, dir 0 = east, clockwise in 45 degree steps
(2 = south, 4 = west, 6 = north).

Aimed towers: 0 boats (twin DShK -> 107mm rocket rack -> gold twin rocket rack),
1 aa_gun (twin ZU-23 -> quad -> Mesbah multi-barrel with radar), 2 missile (Noor tube ->
twin Khalij Fars -> big Fattah canister), 3 sam (2 -> 3 -> 4 "Arman" canisters).

Each turret is described once, pointing east, as vector primitives in local coordinates
(u forward, v to the right, origin at the frame centre). Every direction is rasterised from
that description with 4x4 supersampling, so cardinals are exact and diagonals stay clean.
Lighting (top-left) and the outline are applied after rotation so they stay in world space.
"""
import math

from draw import bevel, new, outline, strip
from palette import C

NAME = "turrets"
FRAME = (16, 16)
FRAMES = 96

CX = CY = 8.0
SS = 4
SHADOW = (*C["black"][:3], 90)


# primitives: ("rect", u0, v0, u1, v1, colour) | ("disc", cu, cv, r, colour)
def R(u0, v0, u1, v1, c):
    return ("rect", u0, v0, u1, v1, c)


def D(cu, cv, r, c):
    return ("disc", cu, cv, r, c)


def hit(p, u, v):
    if p[0] == "rect":
        _, u0, v0, u1, v1, _c = p
        return u0 <= u < u1 and v0 <= v < v1
    _, cu, cv, r, _c = p
    return (u - cu) ** 2 + (v - cv) ** 2 <= r * r


def raster(shape, direction):
    ang = direction * math.pi / 4
    ca, sa = math.cos(ang), math.sin(ang)
    img = new(16, 16)
    for y in range(16):
        for x in range(16):
            votes = {}
            for sy in range(SS):
                for sx in range(SS):
                    dx = x + (sx + 0.5) / SS - CX
                    dy = y + (sy + 0.5) / SS - CY
                    u = dx * ca + dy * sa
                    v = -dx * sa + dy * ca
                    col = None
                    for p in reversed(shape):
                        if hit(p, u, v):
                            col = p[-1]
                            break
                    votes[col] = votes.get(col, 0) + 1
            filled = SS * SS - votes.get(None, 0)
            if filled * 2 >= SS * SS:
                votes.pop(None, None)
                img.putpixel((x, y), max(votes.items(), key=lambda kv: kv[1])[0])
    return img


def render(shape, direction):
    body = raster(shape, direction)
    bevel(body, light=0.16, dark=-0.2)
    outline(body)
    out = new(16, 16)
    # soft drop shadow down-right so the turret reads above its base
    for y in range(16):
        for x in range(16):
            if body.getpixel((x, y))[3] and x + 1 < 16 and y + 1 < 16:
                out.putpixel((x + 1, y + 1), SHADOW)
    out.alpha_composite(body)
    return out


# ---------------------------------------------------------------------------
# turret designs (east-facing)

OL, OLL, OLD = C["olive"], C["olive_lt"], C["olive_dk"]
IRON, BLK, GOLD, GOLDD = C["iron"], C["black"], C["gold"], C["gold_dk"]


def boats(tier):
    if tier == 0:  # twin DShK heavy machine guns on a pintle with a gun shield
        return [
            D(0, 0, 2.3, OLD),
            R(-3.0, -1.5, -0.5, 1.5, C["sand_dk"]),  # ammo box
            R(1.5, -1.0, 7.5, 0.0, C["smoke_lt"]),
            R(1.5, 0.0, 7.5, 1.0, C["smoke"]),
            R(6.5, -1.0, 7.5, 1.0, IRON),  # muzzles
            R(0.0, -3.0, 1.5, 3.0, OL),  # gun shield
            R(0.0, -3.0, 1.5, -2.0, OLL),
            D(-1.0, 0, 0.9, C["olive_dk"]),
        ]
    if tier == 1:  # 107mm multiple rocket rack (3 rows of tubes), operator seat behind
        return [
            D(-1.5, 0, 2.0, OLD),
            R(-3.5, -3.0, 5.5, 3.0, OL),
            R(-3.5, -3.0, 5.5, -2.0, OLL),
            R(3.5, -2.0, 4.5, -1.0, BLK),
            R(3.5, -0.5, 4.5, 0.5, BLK),
            R(3.5, 1.0, 4.5, 2.0, BLK),
            R(4.5, -3.0, 5.5, 3.0, C["sand"]),
            R(-1.0, -3.0, 0.0, 3.0, OLD),  # strap
            R(-5.0, -1.0, -3.5, 1.0, C["sand_dk"]),  # seat
        ]
    # tier 2: gold-trimmed twin rocket racks with a sight between them
    return [
        D(-1.5, 0, 2.2, IRON),
        R(-4.0, -4.5, 6.0, -0.5, GOLD),
        R(-3.5, -4.0, 5.0, -1.0, OL),
        R(-4.0, 0.5, 6.0, 4.5, GOLD),
        R(-3.5, 1.0, 5.0, 4.0, OL),
        R(4.0, -3.5, 5.0, -2.5, BLK),
        R(4.0, -2.0, 5.0, -1.0, BLK),
        R(4.0, 1.0, 5.0, 2.0, BLK),
        R(4.0, 2.5, 5.0, 3.5, BLK),
        R(-2.0, -0.5, 2.0, 0.5, C["chrome"]),
        R(2.0, -0.5, 3.0, 0.5, C["tie"]),
    ]


def aa_gun(tier):
    if tier == 0:  # twin ZU-23-2
        return [
            D(0, 0, 2.6, OL),
            R(-3.0, -0.5, -0.5, 0.5, OLD),  # gunner seat
            R(-0.5, -2.0, 2.5, 2.0, OLD),  # cradle
            R(2.0, -1.0, 8.0, 0.0, C["smoke_lt"]),
            R(2.0, 0.0, 8.0, 1.0, C["smoke"]),
            R(7.0, -1.0, 8.0, 1.0, IRON),  # flash hiders
            R(-0.5, -3.0, 1.5, -2.0, C["sand_dk"]),  # magazines
            R(-0.5, 2.0, 1.5, 3.0, C["sand_dk"]),
        ]
    if tier == 1:  # quad barrels (two twin pairs)
        return [
            D(0, 0, 3.0, OL),
            R(-3.0, -0.5, -1.0, 0.5, OLD),
            R(-0.5, -3.5, 2.5, 3.5, OLD),
            R(2.0, -3.0, 8.0, -2.0, C["smoke_lt"]),
            R(2.0, -2.0, 8.0, -1.0, C["smoke"]),
            R(2.0, 1.0, 8.0, 2.0, C["smoke_lt"]),
            R(2.0, 2.0, 8.0, 3.0, C["smoke"]),
            R(7.0, -3.0, 8.0, -1.0, IRON),
            R(7.0, 1.0, 8.0, 3.0, IRON),
            R(-1.0, -1.0, 1.0, 1.0, C["sand_dk"]),
        ]
    # tier 2: Mesbah: two multi-barrel gatling pods + search radar dish on top
    return [
        D(0, 0, 3.2, OLD),
        R(-1.0, -4.5, 6.5, -1.5, C["smoke"]),
        R(-1.0, 1.5, 6.5, 4.5, C["smoke"]),
        R(-1.0, -3.5, 7.5, -2.5, C["smoke_lt"]),
        R(-1.0, 2.5, 7.5, 3.5, C["smoke_lt"]),
        R(5.5, -4.5, 6.5, -1.5, GOLD),
        R(5.5, 1.5, 6.5, 4.5, GOLD),
        D(-1.0, 0, 2.4, C["chrome"]),
        D(-1.0, 0, 1.2, C["hull"]),
        R(-1.0, -0.5, 1.5, 0.5, C["tie"]),
    ]


def missile(tier):
    if tier == 0:  # single Noor anti-ship missile tube on a rear elevation mount
        return [
            D(-2.0, 0, 2.4, OLD),
            R(-5.0, -1.5, 7.0, 1.5, C["sand"]),
            R(-5.0, -1.5, 7.0, -0.5, C["sand_lt"]),
            R(6.0, -1.5, 7.0, 1.5, BLK),
            R(6.0, -0.5, 7.0, 0.5, C["tie"]),
            R(-5.0, -1.5, -4.0, 1.5, OLD),
            R(1.0, -2.0, 2.0, 2.0, OL),
        ]
    if tier == 1:  # twin Khalij Fars tubes
        return [
            D(0, 0, 2.6, OLD),
            R(-5.0, -3.5, 6.0, -0.5, C["sand"]),
            R(-5.0, -3.5, 6.0, -2.5, C["sand_lt"]),
            R(-5.0, 0.5, 6.0, 3.5, C["sand"]),
            R(-5.0, 0.5, 6.0, 1.5, C["sand_lt"]),
            R(5.0, -3.5, 6.0, -0.5, C["tie"]),
            R(5.0, 0.5, 6.0, 3.5, C["tie"]),
            R(-0.5, -4.0, 0.5, 4.0, OL),
            R(-5.0, -0.5, 5.0, 0.5, OLD),
        ]
    # tier 2: one huge Fattah canister, gold banded, red nose cap
    return [
        D(0, 0, 3.0, IRON),
        R(-6.0, -3.5, 7.0, 3.5, OLD),
        R(-6.0, -3.5, 7.0, -2.5, OL),
        R(-5.0, -2.5, 6.0, 2.5, OL),
        R(6.0, -2.5, 7.0, 2.5, C["tie"]),
        R(-6.0, -3.5, -5.0, 3.5, GOLD),
        R(1.0, -3.5, 2.0, 3.5, GOLD),
        R(-3.0, -1.0, 0.0, 1.0, C["green"]),
        R(-3.0, -1.0, 0.0, 0.0, C["white"]),
    ]


def sam(tier):
    n = tier + 2
    width = 9.0 if tier < 2 else 10.0
    band = (2.0 * n + (n - 1) * 0.5)
    v = -band / 2
    shape = [D(0, 0, 2.8, OLD if tier < 2 else IRON)]
    for i in range(n):
        shape += [
            R(-width / 2 + 0.5, v, width / 2 + 0.5, v + 2.0, OL),
            R(-width / 2 + 0.5, v, width / 2 + 0.5, v + 1.0, OLL),
            R(width / 2 - 0.5, v, width / 2 + 0.5, v + 2.0, C["white"]),
            R(width / 2 - 1.5, v, width / 2 - 0.5, v + 2.0, GOLD if tier == 2 else OLD),
        ]
        v += 2.5
    shape += [R(-width / 2 - 1.0, -band / 2 + 0.5, -width / 2 + 0.5, band / 2 - 0.5, IRON)]  # hinge beam
    if tier == 2:
        shape += [R(-1.0, -band / 2, 0.0, band / 2, GOLD)]
    return shape


AIMED = [boats, aa_gun, missile, sam]


def build():
    frames = []
    for fn in AIMED:
        for tier in range(3):
            shape = fn(tier)
            frames += [render(shape, d) for d in range(8)]
    assert len(frames) == FRAMES
    return strip(frames)
