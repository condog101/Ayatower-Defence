"""Aimed turret tops, 32x32 transparent (drawn at 1x, twice the world's pixel density), centred on the frame so they overlay the tower base.

frame = ((aimedIndex * 3 + tier) * 8) + dir, dir 0 = east, clockwise in 45 degree steps
(2 = south, 4 = west, 6 = north).

Aimed towers, all iron, bronze and timber siege engines:
0 boats   (light deck ballista -> repeating ballista with a bolt magazine -> gilded repeater),
1 aa_gun  (heavy ballista -> double-bow scorpion -> gold-banded triple-bolt scorpion),
2 missile (the great bow: yew -> iron-shod with a war bolt -> golden bow with a flaming bolt),
3 sam     (siege crossbow battery: 2 -> 3 -> 4 bolts on one bronze bow-bar).

Each turret is described once, pointing east, as vector primitives in local coordinates
(u forward, v to the right, origin at the frame centre, UNIT px per unit). Every direction is
rasterised from that description with SSxSS supersampling, so cardinals are exact and diagonals stay clean.
Lighting (top-left) and the outline are applied after rotation so they stay in world space.
"""
import math

from draw import bevel, new, outline, strip
from palette import C

NAME = "turrets"
FRAME = (32, 32)
FRAMES = 96

CX = CY = 16.0
SS = 4
UNIT = 2.0  # the designs were drawn for 16x16; one local unit is two pixels now
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
    img = new(32, 32)
    for y in range(32):
        for x in range(32):
            votes = {}
            for sy in range(SS):
                for sx in range(SS):
                    dx = x + (sx + 0.5) / SS - CX
                    dy = y + (sy + 0.5) / SS - CY
                    u = (dx * ca + dy * sa) / UNIT
                    v = (-dx * sa + dy * ca) / UNIT
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
    out = new(32, 32)
    # soft drop shadow down-right so the turret reads above its base
    for y in range(32):
        for x in range(32):
            if body.getpixel((x, y))[3] and x + 2 < 32 and y + 2 < 32:
                out.putpixel((x + 2, y + 2), SHADOW)
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
        out += [L(u - sweep, -span, string_to, 0, 0.6, STRING), L(u - sweep, span, string_to, 0, 0.6, STRING)]
    out += [L(u, -0.8, u - sweep, -span, w, c), L(u, 0.8, u - sweep, span, w, c)]
    if tip:
        out += [D(u - sweep, -span, w * 0.6, tip), D(u - sweep, span, w * 0.6, tip)]
    return out


def bolt(u0, u1, v=0.0, head=None, fletch=None):
    head = head or IRON
    out = [R(u0, v - 0.5, u1, v + 0.5, STEEL_LT if fletch is None else WOOD)]
    out += [R(u0, v - 0.5, u1, v, C["chrome"] if fletch is None else C["parch"])]  # lit upper edge
    out += [L(u1 - 0.5, v - 1.0, u1 + 1.0, v, 1.0, head), L(u1 - 0.5, v + 1.0, u1 + 1.0, v, 1.0, head)]
    vane = fletch or C["parch_dk"]
    out += [L(u0, v - 1.1, u0 + 1.4, v - 0.4, 0.6, vane), L(u0, v + 1.1, u0 + 1.4, v + 0.4, 0.6, vane)]
    return out


def turntable(cu, r, c, rivet=None, n=6):
    """Iron turntable disc with rivets round the rim (half a unit is one pixel now)."""
    rivet = rivet or STEEL_LT
    out = [D(cu, 0, r, c)]
    for k in range(n):
        a = 2 * math.pi * k / n + math.pi / n
        out.append(D(cu + math.cos(a) * (r - 0.55), math.sin(a) * (r - 0.55), 0.32, rivet))
    return out


def boats(tier):
    if tier == 0:  # light deck ballista: timber stock, wooden arms
        return [
            *turntable(-1.0, 2.2, IRON),
            *bow_arms(2.5, 4.5, 2.0, WOOD, string_to=-2.0),
            R(-4.0, -1.0, 4.0, 1.0, WOOD),
            R(-4.0, -1.0, 4.0, -0.4, C["parch_dk"]),
            *bolt(-2.0, 5.5),
            R(-5.0, -1.5, -4.0, 1.5, IRON),  # winch
            L(-4.5, -1.5, -4.5, -2.4, 0.6, WOOD), L(-4.5, 1.5, -4.5, 2.4, 0.6, WOOD),  # windlass handles
        ]
    if tier == 1:  # repeating ballista: iron arms and a bolt magazine on the stock
        return [
            *turntable(-1.0, 2.4, IRON),
            *bow_arms(3.0, 5.2, 2.2, IRON, tip=STEEL_LT, string_to=-2.0),
            R(-4.5, -1.0, 4.5, 1.0, WOOD),
            *bolt(-1.0, 6.0),
            R(-2.5, -1.8, 1.0, 1.8, WOODD),  # magazine hopper
            R(-2.5, -1.8, 1.0, -1.0, WOOD),
            R(-1.0, -1.8, -0.2, 1.8, IRON),  # iron band
            R(-5.5, -2.0, -4.5, 2.0, IRON),
            D(-5.0, -2.4, 0.5, STEEL), D(-5.0, 2.4, 0.5, STEEL),
        ]
    # tier 2: gilded repeater, bronze arms with gold tips, gold-banded magazine
    return [
        *turntable(-1.0, 2.6, BRONZE, GOLD),
        *bow_arms(3.0, 5.8, 2.4, BRONZE, w=1.6, tip=GOLD, string_to=-2.0),
        R(-4.5, -1.2, 4.5, 1.2, WOOD),
        *bolt(-1.0, 6.2, head=GOLD),
        R(-2.8, -2.0, 1.2, 2.0, WOODD),
        R(-2.8, -2.0, 1.2, -1.2, WOOD),
        R(-1.2, -2.0, -0.2, 2.0, GOLD),
        R(-6.0, -2.2, -4.5, 2.2, IRON),
        R(-6.0, -2.2, -5.2, 2.2, GOLD),
        D(-5.4, -2.6, 0.55, GOLD), D(-5.4, 2.6, 0.55, GOLD),
    ]


def aa_gun(tier):
    if tier == 0:  # heavy bastion ballista on a turntable
        return [
            *turntable(0, 2.8, IRON, n=8),
            *bow_arms(3.0, 6.0, 2.6, IRON, w=1.6, tip=STEEL_LT, string_to=-2.5),
            R(-5.0, -1.2, 4.5, 1.2, WOOD),
            R(-5.0, -1.2, 4.5, -0.5, C["parch_dk"]),
            *bolt(-2.5, 6.0),
            R(-6.0, -2.0, -4.5, 2.0, IRON),
            D(-5.2, -2.2, 0.8, STEEL), D(-5.2, 2.2, 0.8, STEEL),  # winch handles
        ]
    if tier == 1:  # double-bow scorpion: two stacked bows on one stock
        return [
            *turntable(0, 3.0, IRON, n=8),
            *bow_arms(4.0, 5.0, 2.0, IRON, w=1.4, tip=STEEL_LT, string_to=-1.0),
            *bow_arms(1.0, 6.4, 2.4, WOODD, w=1.5, tip=STEEL_LT),
            R(-5.0, -1.2, 5.0, 1.2, WOOD),
            *bolt(-1.0, 6.2),
            R(-6.0, -2.2, -4.5, 2.2, IRON),
            D(-5.2, -2.5, 0.8, STEEL), D(-5.2, 2.5, 0.8, STEEL),
        ]
    # tier 2: triple-bolt scorpion: three bolts fanned from one stock, gold-banded bronze arms
    return [
        *turntable(0, 3.2, BRONZE, GOLD, n=8),
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
        *turntable(-1.5, 2.6, IRON if tier < 2 else BRONZE, GOLD if tier == 2 else None),
        L(-0.6, -span, pull, 0, 0.6, STRING), L(-0.6, span, pull, 0, 0.6, STRING),
        *great_bow(span, bowc, tipc),
        R(-1.0, -1.0, 4.0, 1.0, WOOD if tier < 2 else GOLD),  # grip / riser
        *bolt(pull, 6.0, head=head, fletch=fl),
    ]
    if tier == 2:
        shape += [D(7.0, 0, 0.9, C["fire_yellow"]), D(7.0, 0, 0.4, C["white"]),
                  D(-0.6, -span, 0.5, GOLD), D(-0.6, span, 0.5, GOLD)]
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
        *turntable(-2.0, 2.4, IRON, GOLD if tier == 2 else None),
        L(0.4, -span, -3.5, -edge + 0.5, 0.6, STRING), L(0.4, span, -3.5, edge - 0.5, 0.6, STRING),
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
    for vv in (-edge + 0.4, edge - 0.4):
        shape += [D(-4.2, vv, 0.3, STEEL_LT), D(2.2, vv, 0.3, STEEL_LT)]  # frame rivets
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
