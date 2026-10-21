"""Aimed turret tops, 16x16 transparent, centred on the frame so they overlay the tower base.

frame = ((aimedIndex * 3 + tier) * 8) + dir, dir 0 = east, clockwise in 45 degree steps
(2 = south, 4 = west, 6 = north).

Aimed towers, all iron, bronze and timber siege engines:
0 boats   (light deck ballista -> repeating ballista with a bolt magazine -> gilded repeater),
1 aa_gun  (heavy ballista -> double-bow scorpion -> gold-banded triple-bolt scorpion),
2 missile (the great bow: yew -> iron-shod with a war bolt -> golden bow with a flaming bolt),
3 sam     (siege crossbow battery: 2 -> 3 -> 4 bolts on one bronze bow-bar).

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
#           | ("line", u0, v0, u1, v1, width, colour)
def R(u0, v0, u1, v1, c):
    return ("rect", u0, v0, u1, v1, c)


def D(cu, cv, r, c):
    return ("disc", cu, cv, r, c)


def L(u0, v0, u1, v1, w, c):
    return ("line", u0, v0, u1, v1, w, c)


def hit(p, u, v):
    if p[0] == "line":
        _, u0, v0, u1, v1, w, _c = p
        du, dv = u1 - u0, v1 - v0
        t = max(0.0, min(1.0, ((u - u0) * du + (v - v0) * dv) / (du * du + dv * dv)))
        return (u - u0 - t * du) ** 2 + (v - v0 - t * dv) ** 2 <= (w / 2) ** 2
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

WOOD, WOODD = C["wood"], C["wood_dk"]
IRON, BLK, GOLD, BRONZE = C["iron"], C["black"], C["gold"], C["gold_dk"]
STEEL, STEEL_LT, STRING = C["smoke"], C["smoke_lt"], C["cream"]


def bow_arms(u, span, sweep, c, w=1.4, tip=None, string_to=None):
    """A pair of bow arms rooted at (u, +-1) sweeping back to (u - sweep, +-span), with a
    bowstring drawn back to string_to (drawn first so the arms sit on top)."""
    out = []
    if string_to is not None:
        out += [L(u - sweep, -span, string_to, 0, 1.1, STRING), L(u - sweep, span, string_to, 0, 1.1, STRING)]
    out += [L(u, -0.8, u - sweep, -span, w, c), L(u, 0.8, u - sweep, span, w, c)]
    if tip:
        out += [D(u - sweep, -span, w * 0.6, tip), D(u - sweep, span, w * 0.6, tip)]
    return out


def bolt(u0, u1, v=0.0, head=None, fletch=None):
    head = head or IRON
    out = [R(u0, v - 0.5, u1, v + 0.5, STEEL_LT if fletch is None else WOOD)]
    out += [L(u1 - 0.5, v - 1.0, u1 + 1.0, v, 1.0, head), L(u1 - 0.5, v + 1.0, u1 + 1.0, v, 1.0, head)]
    if fletch:
        out += [R(u0, v - 1.0, u0 + 1.2, v + 1.0, fletch)]
    return out


def boats(tier):
    if tier == 0:  # light deck ballista: timber stock, wooden arms
        return [
            D(-1.0, 0, 2.2, IRON),
            *bow_arms(2.5, 4.5, 2.0, WOOD, string_to=-2.0),
            R(-4.0, -1.0, 4.0, 1.0, WOOD),
            R(-4.0, -1.0, 4.0, -0.4, C["parch_dk"]),
            *bolt(-2.0, 5.5),
            R(-5.0, -1.5, -4.0, 1.5, IRON),  # winch
        ]
    if tier == 1:  # repeating ballista: iron arms and a bolt magazine on the stock
        return [
            D(-1.0, 0, 2.4, IRON),
            *bow_arms(3.0, 5.2, 2.2, IRON, tip=STEEL_LT, string_to=-2.0),
            R(-4.5, -1.0, 4.5, 1.0, WOOD),
            *bolt(-1.0, 6.0),
            R(-2.5, -1.8, 1.0, 1.8, WOODD),  # magazine hopper
            R(-2.5, -1.8, 1.0, -1.0, WOOD),
            R(-1.0, -1.8, -0.2, 1.8, IRON),  # iron band
            R(-5.5, -2.0, -4.5, 2.0, IRON),
        ]
    # tier 2: gilded repeater, bronze arms with gold tips, gold-banded magazine
    return [
        D(-1.0, 0, 2.6, BRONZE),
        *bow_arms(3.0, 5.8, 2.4, BRONZE, w=1.6, tip=GOLD, string_to=-2.0),
        R(-4.5, -1.2, 4.5, 1.2, WOOD),
        *bolt(-1.0, 6.2, head=GOLD),
        R(-2.8, -2.0, 1.2, 2.0, WOODD),
        R(-2.8, -2.0, 1.2, -1.2, WOOD),
        R(-1.2, -2.0, -0.2, 2.0, GOLD),
        R(-6.0, -2.2, -4.5, 2.2, IRON),
        R(-6.0, -2.2, -5.2, 2.2, GOLD),
    ]


def aa_gun(tier):
    if tier == 0:  # heavy bastion ballista on a turntable
        return [
            D(0, 0, 2.8, IRON),
            *bow_arms(3.0, 6.0, 2.6, IRON, w=1.6, tip=STEEL_LT, string_to=-2.5),
            R(-5.0, -1.2, 4.5, 1.2, WOOD),
            R(-5.0, -1.2, 4.5, -0.5, C["parch_dk"]),
            *bolt(-2.5, 6.0),
            R(-6.0, -2.0, -4.5, 2.0, IRON),
            D(-5.2, -2.2, 0.8, STEEL), D(-5.2, 2.2, 0.8, STEEL),  # winch handles
        ]
    if tier == 1:  # double-bow scorpion: two stacked bows on one stock
        return [
            D(0, 0, 3.0, IRON),
            *bow_arms(4.0, 5.0, 2.0, IRON, w=1.4, tip=STEEL_LT, string_to=-1.0),
            *bow_arms(1.0, 6.4, 2.4, WOODD, w=1.5, tip=STEEL_LT),
            R(-5.0, -1.2, 5.0, 1.2, WOOD),
            *bolt(-1.0, 6.2),
            R(-6.0, -2.2, -4.5, 2.2, IRON),
            D(-5.2, -2.5, 0.8, STEEL), D(-5.2, 2.5, 0.8, STEEL),
        ]
    # tier 2: triple-bolt scorpion: three bolts fanned from one stock, gold-banded bronze arms
    return [
        D(0, 0, 3.2, BRONZE),
        *bow_arms(3.0, 6.6, 2.6, BRONZE, w=1.7, tip=GOLD, string_to=-2.5),
        L(-2.0, 0, 5.2, -2.6, 1.0, STEEL_LT), L(-2.0, 0, 5.2, 2.6, 1.0, STEEL_LT),
        D(5.4, -2.7, 0.8, GOLD), D(5.4, 2.7, 0.8, GOLD),
        R(-5.0, -1.2, 4.0, 1.2, WOOD),
        R(-5.0, -1.2, 4.0, -0.5, C["parch_dk"]),
        *bolt(-2.5, 6.2, head=GOLD),
        R(-6.2, -2.2, -4.6, 2.2, IRON),
        R(-6.2, -2.2, -5.4, 2.2, GOLD),
        R(1.0, -1.2, 1.8, 1.2, GOLD),
    ]


def great_bow(span, c, tip, w=1.7):
    """A tall recurve bow: arms bow forward then curl back at the tips."""
    return [
        L(3.0, 0.0, 2.2, -span * 0.55, w, c), L(2.2, -span * 0.55, 0.0, -span * 0.9, w, c),
        L(0.0, -span * 0.9, -0.6, -span, w * 0.8, tip),
        L(3.0, 0.0, 2.2, span * 0.55, w, c), L(2.2, span * 0.55, 0.0, span * 0.9, w, c),
        L(0.0, span * 0.9, -0.6, span, w * 0.8, tip),
    ]


def missile(tier):
    span = 6.6 if tier == 0 else 7.0
    pull = -3.5 if tier == 0 else -4.2
    if tier == 0:  # the great yew bow on a swivel, a long iron-headed bolt nocked
        bowc, tipc, head, fl = WOODD, WOOD, IRON, C["parch"]
    elif tier == 1:  # iron-shod great bow, a barbed war bolt with red fletching
        bowc, tipc, head, fl = WOODD, IRON, STEEL_LT, C["tie"]
    else:  # golden great bow loosing a flaming bolt
        bowc, tipc, head, fl = BRONZE, GOLD, C["fire_orange"], C["tie"]
    shape = [
        D(-1.5, 0, 2.6, IRON if tier < 2 else BRONZE),
        L(-0.6, -span, pull, 0, 1.1, STRING), L(-0.6, span, pull, 0, 1.1, STRING),
        *great_bow(span, bowc, tipc),
        R(-1.0, -1.0, 4.0, 1.0, WOOD if tier < 2 else GOLD),  # grip / riser
        *bolt(pull, 6.0, head=head, fletch=fl),
    ]
    if tier == 2:
        shape += [D(7.0, 0, 0.9, C["fire_yellow"])]
    return shape


def sam(tier):
    """Siege crossbow battery (a polybolos): n bolts racked in an iron frame under one wide
    bronze bow whose swept arms span the whole battery."""
    n = tier + 2
    pitch = 2.0
    band = pitch * (n - 1)
    edge = band / 2 + 1.0
    span = band / 2 + 3.6
    prod = BRONZE
    tip = GOLD if tier == 2 else STEEL_LT
    head = GOLD if tier == 2 else STEEL_LT
    shape = [
        D(-2.0, 0, 2.4, IRON),
        L(0.4, -span, -3.5, -edge + 0.5, 1.0, STRING), L(0.4, span, -3.5, edge - 0.5, 1.0, STRING),
        R(-4.8, -edge, 2.8, edge, IRON),  # iron frame
    ]
    v = -band / 2
    for i in range(n):
        shape += [R(-4.2, v - 0.5, 4.2, v + 0.5, C["parch"]),
                  L(3.8, v - 0.9, 5.4, v, 1.0, head), L(3.8, v + 0.9, 5.4, v, 1.0, head)]
        v += pitch
    shape += [
        L(2.8, -edge, 2.8, edge, 1.2, prod),
        L(2.8, -edge, 0.4, -span, 1.4, prod), L(2.8, edge, 0.4, span, 1.4, prod),
        D(0.4, -span, 0.8, tip), D(0.4, span, 0.8, tip),
    ]
    if tier == 2:
        shape += [R(-4.8, -edge, -4.0, edge, GOLD)]
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
