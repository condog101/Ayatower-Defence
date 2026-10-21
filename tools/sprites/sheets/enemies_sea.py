"""US Navy ships, seen from above, all facing EAST (bow right). 2 frames each = stern wake + bow spray
animation (the submarine has 4: surfaced x2, submerged x2).

Haze-grey hulls with a lit top rim and shaded bottom rim, darker decks, light superstructures,
1px dark outline. Silhouette length and superstructure layout carry the class identity.
"""
from draw import (
    bevel, circle, disc, dither, ellipse, fade, frame_rect, new, outline, poly, px, rect, ring, strip,
)
from palette import C

CLEAR = (0, 0, 0, 0)


def a(c, alpha):
    return (*c[:3], alpha)


# ---------------------------------------------------------------------------
# shared hull helpers (also used by bosses.py)

def taper(x, x0, x1, hw, bow, stern=0):
    """Half-beam at column x for a hull from x0 (stern) to x1 (bow tip)."""
    if x < x0 or x > x1:
        return 0
    k = hw
    if x > x1 - bow:
        t = (x1 - x + 1) / (bow + 1)
        k = max(1, round(hw * t ** 0.62))
    if stern and x < x0 + stern:
        k = min(k, hw - (x0 + stern - x))
    return max(1, k)


def paint_hull(img, cy, x0, x1, half, rim=None, deck=None, lit=None, shade=None, inset=1):
    """Fill a hull from a half-width function: rim colour band, deck inside.

    Rows cy-k .. cy+k-1 are hull (the centreline sits between rows cy-1 and cy)."""
    rim = rim or C["hull"]
    deck = deck or C["hull_dk"]
    lit = lit or C["hull_lt"]
    shade = shade or C["deck"]
    for x in range(x0, x1 + 1):
        k = half(x)
        if k <= 0:
            continue
        for y in range(cy - k, cy + k):
            px(img, x, y, rim)
        ki = k - inset
        if x0 + inset <= x <= x1 - inset and ki > 0:
            nxt = min(half(x - 1), half(x + 1)) - inset
            for y in range(cy - min(ki, max(nxt, 1)), cy + min(ki, max(nxt, 1))):
                px(img, x, y, deck)
        px(img, x, cy - k, lit)
        px(img, x, cy + k - 1, shade)
    for y in range(cy - half(x0), cy + half(x0)):
        px(img, x0, y, shade if y >= cy else rim)


def paint_hull2(img, cy, x0, x1, top, bot, rim, deck, lit, shade, inset=1):
    """Asymmetric hull: top(x) rows above the centreline, bot(x) rows below."""
    for x in range(x0, x1 + 1):
        t, b = top(x), bot(x)
        if t <= 0 and b <= 0:
            continue
        for y in range(cy - t, cy + b):
            px(img, x, y, rim)
        if x0 + inset <= x <= x1 - inset:
            ti = min(t, top(x - 1), top(x + 1)) - inset
            bi = min(b, bot(x - 1), bot(x + 1)) - inset
            for y in range(cy - max(ti, 0), cy + max(bi, 0)):
                px(img, x, y, deck)
        px(img, x, cy - t, lit)
        px(img, x, cy + b - 1, shade)


def block(img, x0, y0, x1, y1, base=None, lit=None, shade=None, shadow=True):
    """Raised superstructure block with a drop shadow down-right and top-left light."""
    base = base or C["hull_lt"]
    lit = lit or C["white"]
    shade = shade or C["hull"]
    if shadow:
        rect(img, x0 + 1, y0 + 1, x1 + 1, y1 + 1, C["deck"])
    rect(img, x0, y0, x1, y1, base)
    rect(img, x0, y0, x1, y0, lit)
    rect(img, x0, y0, x0, y1, lit)
    rect(img, x1, y0 + 1, x1, y1, shade)
    rect(img, x0 + 1, y1, x1, y1, shade)


def vls(img, x0, y0, cols, rows):
    """Vertical launch cells: dark grid with lighter lids."""
    rect(img, x0, y0, x0 + cols - 1, y0 + rows - 1, C["deck"])
    for cx in range(cols):
        for cy in range(rows):
            if (cx + cy) % 2 == 0:
                px(img, x0 + cx, y0 + cy, C["hull"])


def gun(img, x, cy, barrel=3, big=False):
    """Deck gun: round mount with the barrel pointing forward. Mount centred between rows cy-1/cy."""
    if big:
        rect(img, x - 1, cy - 2, x + 1, cy + 1, C["hull_lt"])
        px(img, x - 1, cy - 2, C["white"])
        rect(img, x + 1, cy - 1, x + 1, cy + 1, C["hull"])
        if barrel:
            rect(img, x + 2, cy - 1, x + 1 + barrel, cy - 1, C["iron"])
    else:
        rect(img, x, cy - 1, x + 1, cy, C["hull_lt"])
        px(img, x, cy - 1, C["white"])
        rect(img, x + 2, cy - 1, x + 1 + barrel, cy - 1, C["iron"])


def helipad(img, x0, y0, x1, y1):
    rect(img, x0, y0, x1, y1, C["deck"])
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    r = min(x1 - x0, y1 - y0) / 2 - 0.4
    circle(img, cx, cy, r, C["fire_yellow"], thickness=0.9)


def flag(img, x, y):
    """3x2 US flag hint: blue canton, red/white stripes."""
    px(img, x, y, C["suit"])
    px(img, x + 1, y, C["tie"])
    px(img, x + 2, y, C["white"])
    px(img, x, y + 1, C["tie"])
    px(img, x + 1, y + 1, C["white"])
    px(img, x + 2, y + 1, C["tie"])


def wake(img, x0, cy, half, frame, length=None, spread=1):
    """Churned water behind the stern (left of x0) plus a V of foam along the quarters.

    Only paints transparent pixels so it never covers the outline or hull."""
    w, h = img.size
    k0 = half(x0)
    length = x0 if length is None else length

    def put(x, y, c):
        if 0 <= x < w and 0 <= y < h and img.getpixel((x, y))[3] == 0:
            img.putpixel((x, y), c)

    for x in range(x0 - 1, x0 - 1 - length, -1):
        d = x0 - 1 - x  # distance behind the stern
        band = max(1, k0 - 1 + d // 3)
        for y in range(cy - band, cy + band):
            m = (x + y + frame) % 3
            core = abs(y - cy + 0.5) < band * 0.55
            if core and m != 0:
                put(x, y, a(C["white"] if m == 1 else C["foam"], 220 - d * 12))
            elif (x * 3 + y + frame * 2) % 4 == 0:
                put(x, y, a(C["foam"], 150 - d * 10))
    # quarter wake: a pixel trail just outside the hull outline for the aft third
    for x in range(x0, x0 + max(3, int(spread * 4))):
        k = half(x)
        if (x + frame) % 2 == 0:
            put(x, cy - k - 2, a(C["foam"], 150))
            put(x, cy + k + 1, a(C["foam"], 150))


def spray(img, x1, cy, half, frame, n=4):
    """Bow spray: foam flecks peeling off both sides of the bow."""
    w, h = img.size

    def put(x, y, c):
        if 0 <= x < w and 0 <= y < h and img.getpixel((x, y))[3] == 0:
            img.putpixel((x, y), c)

    for i in range(n):
        x = x1 - 1 - i * 2 - frame
        k = half(x)
        put(x, cy - k - 2, a(C["white"] if i == 0 else C["foam"], 220 - i * 30))
        put(x, cy + k + 1, a(C["white"] if i == 0 else C["foam"], 220 - i * 30))
    put(x1 + 1, cy - 1 + frame, a(C["foam"], 170))


def finish(body, x0, x1, cy, half, frame, wake_len=None, spray_n=4):
    img = outline(body)
    wake(img, x0, cy, half, frame, length=wake_len)
    spray(img, x1, cy, half, frame, n=spray_n)
    return img


class Ship:
    """Base: subclasses define NAME, FRAME, X0, X1, HW, BOW and draw(img)."""

    FRAMES = 2
    X0 = 3
    STERN = 0

    @classmethod
    def half(cls, x):
        return taper(x, cls.X0, cls.X1, cls.HW, cls.BOW, cls.STERN)

    @classmethod
    def body(cls):
        img = new(*cls.FRAME)
        cls.draw(img)
        return img

    @classmethod
    def frame(cls, f):
        cy = cls.FRAME[1] // 2
        return finish(cls.body(), cls.X0, cls.X1, cy, cls.half, f)

    @classmethod
    def build(cls):
        return strip([cls.frame(f) for f in range(cls.FRAMES)])


# ---------------------------------------------------------------------------

class Rhib(Ship):
    """Rigid-hull inflatable: black tubes, grey deck, console, outboard."""

    NAME = "rhib"
    FRAME = (12, 6)
    X0, X1, HW, BOW = 2, 10, 2, 3

    @classmethod
    def draw(cls, img):
        cy = 3
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, rim=C["iron"], deck=C["hull"], lit=C["smoke"],
                   shade=C["black"])
        rect(img, 3, 2, 7, 3, C["hull"])
        rect(img, 6, 2, 6, 3, C["hull_lt"])  # console
        px(img, 7, 2, C["water_dk"])  # windscreen
        px(img, 7, 3, C["water_dk"])
        px(img, 1, 2, C["iron"])  # outboard motor
        px(img, 1, 3, C["black"])
        px(img, 4, 2, C["olive_dk"])  # crew helmet
        px(img, 9, 2, C["smoke"])


class Patrol(Ship):
    """Mk VI patrol boat: long low hull, compact pilothouse amidships, gun fore and aft."""

    NAME = "patrol"
    FRAME = (16, 8)
    X0, X1, HW, BOW = 3, 15, 3, 5
    STERN = 1

    @classmethod
    def draw(cls, img):
        cy = 4
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, deck=C["hull_dk"])
        block(img, 7, 2, 10, 5)
        rect(img, 10, 3, 10, 4, C["water_dk"])  # bridge windows
        px(img, 8, 3, C["iron"])  # mast
        px(img, 8, 4, C["deck"])
        # aft .50 cal / Mk38 forward
        px(img, 4, 3, C["hull_lt"])
        px(img, 4, 4, C["iron"])
        gun(img, 12, cy, barrel=1)
        px(img, 5, 5, C["olive_dk"])  # crew


class Cyclone(Ship):
    """Cyclone-class patrol ship: longer, tall superstructure with mast and funnel, stern ramp."""

    NAME = "cyclone"
    FRAME = (20, 8)
    X0, X1, HW, BOW = 3, 19, 3, 6
    STERN = 1

    @classmethod
    def draw(cls, img):
        cy = 4
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, deck=C["hull_dk"])
        rect(img, 3, 3, 4, 4, C["deck"])  # stern launch ramp
        px(img, 3, 3, C["iron"])
        block(img, 7, 2, 13, 5)
        rect(img, 9, 3, 10, 4, C["hull"])  # funnel
        px(img, 9, 3, C["iron"])
        px(img, 11, 3, C["iron"])  # mast
        px(img, 11, 4, C["tie"])
        rect(img, 13, 3, 13, 4, C["water_dk"])  # bridge windows
        gun(img, 15, cy, barrel=2)
        px(img, 6, 3, C["hull_lt"])  # stinger mount
        px(img, 5, 5, C["hull_lt"])


class Lcs(Ship):
    """Independence-class littoral combat ship: wide angular trimaran, huge flight deck aft,
    faceted superstructure, sharp wave-piercing bow."""

    NAME = "lcs"
    FRAME = (24, 10)
    X0, X1, HW, BOW = 3, 23, 4, 10

    @classmethod
    def half(cls, x):
        if x < cls.X0 or x > cls.X1:
            return 0
        if x <= 12:
            return 4
        if x <= 15:
            return 3
        t = (cls.X1 - x + 1) / (cls.X1 - 15)
        return max(1, round(3 * t ** 0.8))

    @classmethod
    def draw(cls, img):
        cy = 5
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, deck=C["hull"])
        # outrigger seams of the trimaran
        for x in range(4, 15):
            px(img, x, 2, C["hull_dk"])
            px(img, x, 7, C["hull_dk"])
        # flight deck
        rect(img, 3, 3, 10, 6, C["deck"])
        circle(img, 6.5, 4.5, 1.6, C["fire_yellow"], thickness=0.8)
        # faceted superstructure: trapezoid narrowing forward
        rect(img, 12, 6, 17, 7, C["deck"])
        poly(img, [(11, 2), (16, 3), (17, 4), (17, 5), (16, 6), (11, 7)], C["hull_lt"])
        for y in range(2, 7):
            px(img, 11, y, C["white"])
        for x in range(11, 16):
            px(img, x, 2 + (x - 11) // 5, C["white"])
        px(img, 16, 4, C["water_dk"])
        px(img, 16, 5, C["water_dk"])
        rect(img, 13, 4, 14, 5, C["hull"])  # integrated mast block
        px(img, 13, 4, C["iron"])
        gun(img, 19, cy, barrel=1)


class Frigate(Ship):
    """Constellation-class frigate: flight deck + hangar aft, single superstructure with an
    integrated mast, VLS and a 57mm gun forward."""

    NAME = "frigate"
    FRAME = (28, 10)
    X0, X1, HW, BOW = 3, 27, 4, 10
    STERN = 1

    @classmethod
    def draw(cls, img):
        cy = 5
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, deck=C["hull_dk"])
        helipad(img, 4, 2, 8, 7)
        block(img, 9, 2, 12, 7)  # hangar
        rect(img, 9, 3, 9, 6, C["hull"])  # hangar door
        block(img, 13, 2, 20, 7)
        rect(img, 14, 3, 15, 5, C["hull"])  # funnel
        rect(img, 14, 4, 15, 4, C["iron"])
        rect(img, 17, 3, 18, 6, C["hull"])  # integrated mast with arrays
        px(img, 17, 3, C["suit"])
        px(img, 18, 6, C["suit"])
        px(img, 18, 4, C["tie"])
        rect(img, 20, 3, 20, 6, C["water_dk"])
        vls(img, 22, 3, 2, 4)
        gun(img, 24, cy, barrel=1)


class Burke(Ship):
    """Arleigh Burke destroyer: broad armoured look, helipad, two funnels, SPY-1 panels, VLS
    fore and aft, 5-inch gun forward."""

    NAME = "burke"
    FRAME = (32, 10)
    X0, X1, HW, BOW = 3, 31, 4, 9

    @classmethod
    def draw(cls, img):
        cy = 5
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, rim=C["hull_dk"], deck=C["deck"], lit=C["hull"],
                   shade=C["iron"])
        helipad(img, 4, 2, 8, 7)
        vls(img, 9, 3, 3, 4)
        block(img, 12, 2, 22, 7, base=C["hull"], lit=C["hull_lt"], shade=C["hull_dk"])
        for fx in (13, 16):  # twin funnels with soot
            rect(img, fx, 3, fx + 1, 6, C["hull_dk"])
            rect(img, fx, 4, fx + 1, 5, C["iron"])
        rect(img, 19, 4, 20, 5, C["hull_lt"])  # mast
        px(img, 19, 4, C["black"])
        px(img, 20, 4, C["tie"])
        for x, y in ((21, 2), (21, 7), (22, 3), (22, 6)):  # SPY-1 array corners
            px(img, x, y, C["suit"])
        rect(img, 22, 4, 22, 5, C["water_dk"])
        vls(img, 23, 3, 3, 4)
        gun(img, 26, cy, barrel=2, big=True)
        px(img, 29, 4, C["hull_lt"])


class Sub(Ship):
    """Virginia-class attack submarine. 0-1 surfaced (black hull, sail, wake); 2-3 submerged
    (translucent dark shape under the water with just a periscope feather)."""

    NAME = "sub"
    FRAME = (24, 8)
    FRAMES = 4
    X0, X1, HW, BOW = 3, 23, 3, 5
    STERN = 0

    @classmethod
    def half(cls, x):
        if x < cls.X0 or x > cls.X1:
            return 0
        if x < 7:  # long tapering tail cone
            return max(1, 1 + (x - cls.X0) // 2)
        if x > cls.X1 - 3:
            return max(1, 3 - (x - (cls.X1 - 3)))
        return 3

    @classmethod
    def draw(cls, img):
        cy = 4
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, rim=C["iron"], deck=C["iron"], lit=C["smoke"],
                   shade=C["black"])
        for x in range(8, 21):
            px(img, x, 3, C["deck"])  # spine highlight
        # cruciform stern planes + pump-jet
        for y in (1, 6):
            px(img, 4, y, C["iron"])
        px(img, 4, 2, C["iron"])
        px(img, 4, 5, C["iron"])
        px(img, 2, 3, C["deck"])
        px(img, 2, 4, C["deck"])
        # sail with fairwater planes
        rect(img, 15, 3, 17, 4, C["black"])
        rect(img, 15, 3, 17, 3, C["deck"])
        px(img, 16, 2, C["iron"])
        px(img, 16, 5, C["iron"])
        px(img, 17, 3, C["smoke"])  # periscope
        # hatch + a tiny flag on the sail
        px(img, 11, 3, C["hull_dk"])

    @classmethod
    def frame(cls, f):
        cy = 4
        if f < 2:
            img = finish(cls.body(), cls.X0, cls.X1, cy, cls.half, f, spray_n=3)
            return img
        # submerged: dark translucent silhouette, no outline, periscope feather only
        body = new(*cls.FRAME)
        for x in range(cls.X0, cls.X1 + 1):
            k = cls.half(x)
            for y in range(cy - k, cy + k):
                edge = y == cy - k or y == cy + k - 1 or x in (cls.X0, cls.X1)
                body.putpixel((x, y), a(C["water_dk"] if edge else C["black"], 110 if edge else 125))
        rect(body, 15, 3, 17, 4, a(C["black"], 150))
        # periscope wake: a short V of foam behind the scope at (17, 3)
        ph = f - 2
        px(body, 17, 3, C["smoke_lt"])
        px(body, 18, 3, a(C["white"], 230))
        for i, (x, y) in enumerate([(16, 2), (16, 4), (14, 2 - ph), (14, 5 + ph), (12, 1), (12, 6)]):
            px(body, x - ph, y, a(C["foam"], 210 - i * 25))
        return body


class Tico(Ship):
    """Ticonderoga cruiser: two blocky superstructures with SPY-1 panels, funnels between,
    5-inch guns fore and aft, VLS fore and aft."""

    NAME = "tico"
    FRAME = (36, 12)
    X0, X1, HW, BOW = 3, 35, 5, 11
    STERN = 1

    @classmethod
    def draw(cls, img):
        cy = 6
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, deck=C["hull_dk"])
        gun(img, 6, cy, barrel=0, big=True)
        px(img, 4, 5, C["iron"])  # aft gun barrel points aft
        px(img, 3, 5, C["iron"])
        vls(img, 8, 3, 3, 6)
        # aft deckhouse
        block(img, 12, 2, 17, 9)
        rect(img, 13, 4, 14, 7, C["hull"])
        for x, y in ((17, 3), (17, 8)):
            px(img, x, y, C["suit"])
        # funnels between the houses
        rect(img, 18, 3, 20, 8, C["hull"])
        rect(img, 19, 4, 19, 7, C["iron"])
        px(img, 18, 3, C["hull_lt"])
        # forward deckhouse with the bridge and the tall mast
        block(img, 21, 2, 27, 9)
        rect(img, 23, 5, 24, 6, C["hull"])
        px(img, 23, 5, C["black"])
        px(img, 24, 6, C["tie"])
        for x, y in ((26, 2), (26, 9), (27, 3), (27, 8)):
            px(img, x, y, C["suit"])
        rect(img, 27, 4, 27, 7, C["water_dk"])
        vls(img, 28, 4, 2, 4)
        gun(img, 31, cy, barrel=2, big=True)


class Lhd(Ship):
    """Wasp-class amphibious assault ship: full-length flat flight deck, island on the starboard
    (south) side, numbered helicopter spots, a parked Seahawk and an Osprey."""

    NAME = "lhd"
    FRAME = (48, 16)
    X0, X1, HW, BOW = 3, 47, 7, 7

    @classmethod
    def half(cls, x):
        if x < cls.X0 or x > cls.X1:
            return 0
        if x > 40:
            return max(2, round(7 - (x - 40) * 0.75))
        return 7

    @classmethod
    def draw(cls, img):
        cy = 8
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, rim=C["hull"], deck=C["deck"])
        # deck edge safety line + dashed centreline
        for x in range(5, 43, 3):
            px(img, x, cy, C["white"])
            px(img, x + 1, cy, C["white"])
        for x in range(4, 44):
            px(img, x, 2, C["hull_dk"])
        # helicopter landing spots along the port side
        for i, sx in enumerate(range(8, 40, 7)):
            circle(img, sx, 4.5, 1.5, C["fire_yellow"], thickness=0.7)
            px(img, sx, 4, C["white"])
        # island superstructure on the starboard side
        rect(img, 26, 11, 35, 14, C["deck"])
        block(img, 25, 10, 34, 13)
        rect(img, 28, 11, 29, 12, C["hull"])  # stack
        px(img, 28, 11, C["iron"])
        rect(img, 31, 11, 31, 12, C["iron"])  # mast
        px(img, 32, 11, C["tie"])
        rect(img, 34, 11, 34, 12, C["water_dk"])
        # deck-edge elevator (starboard aft)
        rect(img, 14, 12, 18, 14, C["hull_dk"])
        frame_rect(img, 14, 12, 18, 14, C["iron"])
        # parked Seahawk on spot 2 and an Osprey forward
        rect(img, 14, 8, 17, 9, C["hull_lt"])
        rect(img, 12, 8, 13, 8, C["hull"])
        px(img, 15, 7, C["hull"])
        px(img, 15, 10, C["hull"])
        rect(img, 37, 9, 41, 9, C["hull"])
        rect(img, 39, 7, 39, 11, C["hull_lt"])
        px(img, 39, 6, C["hull"])
        px(img, 39, 12, C["hull"])
        # bow / stern well deck
        rect(img, 3, 6, 3, 9, C["iron"])


class Carrier(Ship):
    """Nimitz-class carrier: big flat deck with an angled landing strip, catapults, island to
    starboard, parked jets."""

    NAME = "carrier"
    FRAME = (64, 20)
    X0, X1 = 3, 63
    CY = 10

    @staticmethod
    def top(x):
        if x < 3 or x > 63:
            return 0
        if 14 <= x <= 44:  # port sponson carrying the angled deck
            return 9 if x <= 40 else 9 - (x - 40)
        if x < 14:
            return 7 + (x - 3) // 6
        t = (63 - x + 1) / 20
        return max(2, round(7 * t ** 0.5))

    @staticmethod
    def bot(x):
        if x < 3 or x > 63:
            return 0
        if 34 <= x <= 47:  # island sponson
            return 9
        if x > 47:
            t = (63 - x + 1) / 17
            return max(2, round(8 * t ** 0.5))
        return 8

    @classmethod
    def half(cls, x):
        return max(cls.top(x), cls.bot(x))

    @classmethod
    def body(cls):
        img = new(*cls.FRAME)
        cy = cls.CY
        paint_hull2(img, cy, cls.X0, cls.X1, cls.top, cls.bot, C["hull"], C["deck"], C["hull_lt"], C["iron"])
        # angled landing area: from the stern centreline up toward the port bow
        for x in range(5, 42):
            yc = cy - 1 - (x - 5) * 0.2
            for off, col in ((-3, C["white"]), (3, C["white"])):
                if (x // 2) % 2 == 0:
                    px(img, x, round(yc + off), col)
            if (x // 3) % 2 == 0:
                px(img, x, round(yc), C["fire_yellow"])
        # arrestor wires
        for x in (10, 12, 14):
            for d in range(-2, 3):
                px(img, x, round(cy - 1 - (x - 5) * 0.2 + d), C["hull_dk"])
        # bow catapults
        for y in (cy - 3, cy + 1):
            for x in range(44, 60):
                px(img, x, y, C["hull_dk"])
            px(img, 44, y, C["fire_yellow"])
        for y in (cy - 6, cy - 5):  # waist catapult
            for x in range(28, 42):
                px(img, x, y - (x - 28) // 6, C["hull_dk"])
        # island to starboard
        rect(img, 39, 16, 46, 18, C["iron"])
        block(img, 38, 15, 45, 17)
        rect(img, 40, 16, 41, 16, C["hull"])
        px(img, 40, 16, C["iron"])
        rect(img, 43, 15, 43, 17, C["iron"])  # mast
        px(img, 44, 16, C["tie"])
        # parked jets (tiny Hornets) along the bow and the aft starboard deck
        for jx, jy in ((52, cy + 4), (56, cy + 4), (48, cy + 6), (20, cy + 5), (24, cy + 5), (28, cy + 5)):
            px(img, jx, jy, C["hull_lt"])
            px(img, jx + 1, jy, C["hull_lt"])
            px(img, jx + 2, jy, C["hull"])
            px(img, jx + 1, jy - 1, C["hull"])
            px(img, jx + 1, jy + 1, C["hull"])
            px(img, jx, jy - 1, C["hull_dk"])
            px(img, jx, jy + 1, C["hull_dk"])
        # hull number on the bow deck
        for x in (58, 59):
            px(img, x, cy - 1, C["white"])
            px(img, x, cy, C["white"])
        # elevators
        rect(img, 30, 2, 34, 3, C["hull_dk"])
        rect(img, 49, 17, 52, 17, C["hull_dk"])
        return img

    @classmethod
    def frame(cls, f):
        return finish(cls.body(), cls.X0, cls.X1, cls.CY, cls.half, f, spray_n=6)
