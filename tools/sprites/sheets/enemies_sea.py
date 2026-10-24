"""Sauron's host at sea: US Navy silhouettes in Mordor dress (fictional satire), seen from above,
all facing EAST (bow right). 2 frames each = stern wake + bow spray (+ oar strokes on the small
galleys); the submarine has 4: surfaced x2, submerged x2.

Black-iron hulls with a lit grey top rim and a blood-red waterline so they read on the dark-teal
sea, iron rams and spikes on every prow, a red Eye emblem on each ship, glowing forge-windows,
ballistae instead of deck guns, tattered red sails from the frigate up, and riveted iron plating
on the armoured kinds (burke, tico, lhd, carrier). Silhouette length and the layout of the
deckhouses still carry the class identity.
"""
from draw import circle, new, outline, poly, px, rect, rng, strip
from palette import C

CLEAR = (0, 0, 0, 0)

RIM, LIT, SHADE = C["iron"], C["smoke"], C["maroon"]
DECK_WOOD = C["wood_dk"]
PLATE = C["stone_dk"]


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
    rim = rim or RIM
    deck = deck or DECK_WOOD
    lit = lit or LIT
    shade = shade or SHADE
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


def planks(img, x0, x1, y0, y1, deck=None, seam=None, step=3):
    """Timber deck seams: every `step` columns a lighter plank joint (only on deck pixels)."""
    deck = deck or DECK_WOOD
    seam = seam or C["wood"]
    for x in range(x0, x1 + 1):
        if (x - x0) % step:
            continue
        for y in range(y0, y1 + 1):
            if img.getpixel((x, y)) == deck and (x + y) % 2 == 0:
                px(img, x, y, seam)


def plating(img, x0, x1, y0, y1, deck=None, step=4):
    """Riveted iron plates: a dark seam every `step` columns, rivets along the plate middles."""
    deck = deck or PLATE
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if img.getpixel((x, y)) != deck:
                continue
            if (x - x0) % step == 0:
                px(img, x, y, C["iron"])
            elif (x - x0) % step == step // 2 and (y - y0) % 3 == 1:
                px(img, x, y, C["stone"])


def block(img, x0, y0, x1, y1, base=None, lit=None, shade=None, shadow=True, spikes=False):
    """Raised black-iron deckhouse with a drop shadow down-right and top-left light.

    spikes=True adds a crenellated crown of spikes along the lit top edge."""
    base = base or C["iron"]
    lit = lit or C["smoke"]
    shade = shade or C["black"]
    if shadow:
        rect(img, x0 + 1, y0 + 1, x1 + 1, y1 + 1, a(C["black"], 255))
    rect(img, x0, y0, x1, y1, base)
    rect(img, x0, y0, x1, y0, lit)
    rect(img, x0, y0, x0, y1, lit)
    rect(img, x1, y0 + 1, x1, y1, shade)
    rect(img, x0 + 1, y1, x1, y1, shade)
    if spikes:
        for x in range(x0 + 1, x1, 2):
            px(img, x, y0, C["smoke_lt"])


def window(img, x, y0, y1):
    """Glowing forge-light window slit."""
    for y in range(y0, y1 + 1):
        px(img, x, y, C["fire_orange"] if (y - y0) % 2 == 0 else C["fire_red"])


def forge(img, x0, y0, x1, y1):
    """Funnel turned forge-chimney: iron rim around a glowing ember pit."""
    rect(img, x0, y0, x1, y1, C["black"])
    rect(img, x0, y0, x1, y0, C["smoke"])
    if x1 - x0 >= 1 and y1 - y0 >= 2:
        rect(img, x0 + (1 if x1 - x0 > 1 else 0), y0 + 1, x1 - (1 if x1 - x0 > 1 else 0), y1 - 1, C["fire_red"])
        px(img, x0 + (x1 - x0) // 2, y0 + 1 + (y1 - y0 - 2) // 2, C["fire_yellow"])
    else:
        px(img, x0, y1, C["fire_orange"])


def grate(img, x0, y0, cols, rows):
    """Iron hatch grate over the bolt-magazine (replaces the VLS): ember glow through the bars."""
    rect(img, x0, y0, x0 + cols - 1, y0 + rows - 1, C["black"])
    for cx in range(cols):
        for cy in range(rows):
            if (cx + cy) % 2 == 0:
                px(img, x0 + cx, y0 + cy, C["fire_red"] if (cx * 3 + cy) % 4 == 0 else C["iron"])


def eye(img, cx, cy, size=1):
    """The red Eye emblem. size 0: 2px glint; 1: 3x3 lidless eye; 2: 5x3 eye with a slit pupil."""
    if size == 0:
        px(img, cx, cy, C["tie"])
        px(img, cx + 1, cy, C["fire_orange"])
        return
    if size == 1:
        px(img, cx, cy - 1, C["tie"])
        px(img, cx - 1, cy, C["tie"])
        px(img, cx, cy, C["fire_yellow"])
        px(img, cx + 1, cy, C["tie"])
        px(img, cx, cy + 1, C["tie"])
        return
    for dx in (-1, 0, 1):
        px(img, cx + dx, cy - 1, C["tie"])
        px(img, cx + dx, cy + 1, C["tie"])
    px(img, cx - 2, cy, C["maroon"])
    px(img, cx + 2, cy, C["maroon"])
    px(img, cx - 1, cy, C["fire_orange"])
    px(img, cx + 1, cy, C["fire_orange"])
    px(img, cx, cy, C["black"])
    px(img, cx, cy - 1, C["fire_yellow"])


def ballista(img, x, cy, arm=2, big=False):
    """Deck ballista pointing forward: a lit iron mount, bow arms across, a bolt along the centreline.

    The mount sits between rows cy-1 and cy (same anchor as the old deck gun)."""
    rect(img, x, cy - 1, x + 1, cy, C["smoke"])
    px(img, x, cy - 1, C["smoke_lt"])
    px(img, x + 1, cy, C["iron"])
    reach = 2 if big else 1
    for d in range(1, reach + 1):  # bow arms, swept back
        px(img, x + 1, cy - 1 - d, C["wood"])
        px(img, x + 1, cy + d, C["wood"])
    px(img, x + 1, cy - 1 - reach, C["wood_dk"])
    px(img, x + 1, cy + reach, C["wood_dk"])
    if arm:
        rect(img, x + 2, cy - 1, x + 1 + arm, cy - 1, C["wood"])
        px(img, x + 1 + arm, cy - 1, C["smoke_lt"])  # iron bolt head


def ram(img, x1, cy, half, spikes=(3, 6)):
    """Iron ram on the bow tip plus spikes jutting from the bow flanks (drawn before the outline)."""
    for x in (x1, x1 - 1):
        k = half(x)
        for y in range(cy - k, cy + k):
            px(img, x, y, C["smoke_lt"] if y < cy else C["smoke"])
    px(img, x1, cy - 1, C["chrome"])
    for back in spikes:
        x = x1 - back
        k = half(x)
        if k <= 0:
            continue
        px(img, x, cy - k - 1, C["smoke_lt"])
        px(img, x, cy + k, C["smoke"])


def sail(img, x, y0, y1, seed=0, depth=4):
    """Tattered red square sail seen from above: dark yard at column x, cloth billowing forward
    (east) to `depth` px in the middle, a sunlit upper half, ragged holes and a torn leech."""
    rnd = rng(seed)
    n = y1 - y0
    for y in range(y0, y1 + 1):
        t = (y - y0) / max(n, 1)
        reach = max(1, round(depth * (1 - (2 * t - 1) ** 2) ** 0.5))
        for d in range(1, reach + 1):
            if d == reach and reach > 1 and rnd.random() < 0.3:
                continue  # torn leech
            if 1 < d < reach and 0 < y - y0 < n and rnd.random() < 0.07:
                continue  # holes
            if d == 1:
                c = C["maroon"]  # shadow under the yard
            elif d == reach and t > 0.5:
                c = C["maroon"]
            elif t < 0.45:
                c = C["fire_red"] if d >= reach - 1 else C["tie"]
            else:
                c = C["tie"]
            px(img, x + d, y, c)
        px(img, x, y, C["wood_dk"])
    px(img, x, (y0 + y1) // 2, C["black"])  # mast top


def banner(img, x, y, length=3):
    """Black pennant with a red Eye glint, streaming aft from a mast at (x, y)."""
    px(img, x, y, C["wood_dk"])
    for k in range(1, length + 1):
        px(img, x - k, y, C["black"] if k != 1 else C["iron"])
    px(img, x - 1, y, C["tie"])


def summoning_ring(img, x0, y0, x1, y1):
    """Old helipad: a black deck square with a red ring and a dark rune dot."""
    rect(img, x0, y0, x1, y1, C["black"])
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    r = min(x1 - x0, y1 - y0) / 2 - 0.4
    circle(img, cx, cy, r, C["maroon"], thickness=0.9)
    px(img, round(cx), round(cy), C["fire_red"])


def oars(img, xs, cy, half, f):
    """Oar blades sweeping out of both sides; the stroke alternates between frames."""
    for i, x in enumerate(xs):
        k = half(x)
        dx = (1 if (i + f) % 2 else -1)
        px(img, x, cy - k - 1, C["wood"])
        px(img, x + dx, cy - k - 2, C["wood_dk"])
        px(img, x, cy + k, C["wood"])
        px(img, x + dx, cy + k + 1, C["wood_dk"])


def drake(img, x, y):
    """Parked bat-winged drake facing east (5x5): black body, grey wings, red eye."""
    for w in (1, 2):
        px(img, x + 1, y - w, C["smoke"])
        px(img, x + 1, y + w, C["smoke"])
    px(img, x, y - 2, C["stone"])
    px(img, x, y + 2, C["stone"])
    px(img, x - 1, y, C["black"])
    px(img, x, y, C["black"])
    px(img, x + 1, y, C["black"])
    px(img, x + 2, y, C["black"])
    px(img, x + 3, y, C["fire_red"])


def wake(img, x0, cy, half, frame, length=None, spread=1):
    """Churned water behind the stern (left of x0) plus a V of foam along the quarters.

    Only paints transparent pixels so it never covers the outline or hull."""
    w, h = img.size
    k0 = half(x0)
    length = x0 if length is None else length

    def put(x, y, c):
        if 0 <= x < w and 0 <= y < h and img.getpixel((x, y))[3] == 0:
            img.putpixel((x, y), c)

    core = max(1, min(2, k0 - 1))
    for x in range(x0 - 1, x0 - 1 - length, -1):
        d = x0 - 1 - x  # distance behind the stern
        fade_ = max(90, 245 - d * 30)
        for y in range(cy - core, cy + core):
            m = (x + y + frame) % 3
            put(x, y, a(C["white"] if m else C["foam"], fade_))
        spread_y = core + 1 + d // 2
        if (x + frame) % 2 == 0:
            put(x, cy - spread_y, a(C["foam"], fade_ - 40))
            put(x, cy + spread_y - 1, a(C["foam"], fade_ - 40))
        else:
            put(x, cy - spread_y + 1, a(C["shallow"], fade_ - 60))
            put(x, cy + spread_y - 2, a(C["shallow"], fade_ - 60))
    for x in range(x0, x0 + max(3, int(spread * 5))):
        k = half(x)
        if (x + frame) % 2 == 0:
            put(x, cy - k - 2, a(C["foam"], 170))
            put(x, cy + k + 1, a(C["foam"], 170))


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
    """Base: subclasses define NAME, FRAME, X0, X1, HW, BOW and draw(img, f)."""

    FRAMES = 2
    X0 = 3
    STERN = 0

    @classmethod
    def half(cls, x):
        return taper(x, cls.X0, cls.X1, cls.HW, cls.BOW, cls.STERN)

    @classmethod
    def body(cls, f=0):
        img = new(*cls.FRAME)
        cls.draw(img, f)
        return img

    @classmethod
    def frame(cls, f):
        cy = cls.FRAME[1] // 2
        return finish(cls.body(f), cls.X0, cls.X1, cy, cls.half, f)

    @classmethod
    def build(cls):
        return strip([cls.frame(f) for f in range(cls.FRAMES)])


# ---------------------------------------------------------------------------

class Rhib(Ship):
    """Orc longboat (the RHIB): black hull, iron ram, two oars a side and an Eye on the bow."""

    NAME = "rhib"
    FRAME = (12, 6)
    X0, X1, HW, BOW = 2, 10, 2, 3

    @classmethod
    def draw(cls, img, f=0):
        cy = 3
        paint_hull(img, cy, cls.X0, cls.X1, cls.half)
        ram(img, cls.X1, cy, cls.half, spikes=())
        px(img, 3, 2, C["iron"])  # orc helmets at the oars
        px(img, 5, 3, C["iron"])
        px(img, 3, 3, C["smoke"])
        eye(img, 7, 2, 0)
        px(img, 1, 2, C["wood_dk"])  # steering oar
        px(img, 1, 3, C["wood"])
        oars(img, (4, 6), cy, cls.half, f)


class Patrol(Ship):
    """Black galley (the Mk VI): long low hull with oar banks, a small deckhouse with forge-light,
    an Eye pennant and a bow ballista."""

    NAME = "patrol"
    FRAME = (16, 8)
    X0, X1, HW, BOW = 3, 15, 3, 5
    STERN = 1

    @classmethod
    def draw(cls, img, f=0):
        cy = 4
        paint_hull(img, cy, cls.X0, cls.X1, cls.half)
        planks(img, 4, 12, 2, 5)
        ram(img, cls.X1, cy, cls.half, spikes=(3,))
        block(img, 6, 3, 8, 4)
        window(img, 8, 3, 4)
        eye(img, 5, 4, 0)
        ballista(img, 11, cy, arm=1)
        oars(img, (5, 8, 10), cy, cls.half, f)


class Cyclone(Ship):
    """Corsair raider (the Cyclone): longer galley with a spiked forge-tower, chimney embers,
    an Eye banner on the mast and a bow ballista."""

    NAME = "cyclone"
    FRAME = (20, 8)
    X0, X1, HW, BOW = 3, 19, 3, 6
    STERN = 1

    @classmethod
    def draw(cls, img, f=0):
        cy = 4
        paint_hull(img, cy, cls.X0, cls.X1, cls.half)
        planks(img, 4, 15, 2, 5)
        ram(img, cls.X1, cy, cls.half, spikes=(3, 6))
        block(img, 7, 2, 12, 5, spikes=True)
        forge(img, 8, 3, 9, 4)
        eye(img, 11, 3, 0)
        window(img, 12, 3, 4)
        ballista(img, 14, cy, arm=2)
        banner(img, 5, 3, 2)
        oars(img, (6, 13), cy, cls.half, f)


class Lcs(Ship):
    """Trimaran reaver (the Independence LCS): wide angular triple hull, a red summoning ring on
    the broad after-deck, a faceted iron keep and a long spiked wave-piercing ram."""

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
    def draw(cls, img, f=0):
        cy = 5
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, deck=C["stone_dk"])
        for x in range(4, 15):  # outrigger seams of the trimaran
            px(img, x, 2, C["black"])
            px(img, x, 7, C["black"])
        summoning_ring(img, 3, 3, 10, 6)
        rect(img, 12, 6, 17, 7, C["black"])
        poly(img, [(11, 2), (16, 3), (17, 4), (17, 5), (16, 6), (11, 7)], C["iron"])
        for y in range(2, 7):
            px(img, 11, y, C["smoke"])
        for x in range(11, 16):
            px(img, x, 2 + (x - 11) // 5, C["smoke"])
        for x in (12, 14, 16):
            px(img, x, 2 + (x - 11) // 5, C["smoke_lt"])  # spiked crest
        window(img, 16, 4, 5)
        eye(img, 13, 4, 1)
        ram(img, cls.X1, cy, cls.half, spikes=(3, 6))
        ballista(img, 19, cy, arm=1)


class Frigate(Ship):
    """Black-sailed frigate (the Constellation): after-deck with a summoning ring and a hangar,
    one tattered red sail amidships, a deckhouse with the Eye, a bolt grate and a bow ballista."""

    NAME = "frigate"
    FRAME = (28, 10)
    X0, X1, HW, BOW = 3, 27, 4, 10
    STERN = 1

    @classmethod
    def draw(cls, img, f=0):
        cy = 5
        paint_hull(img, cy, cls.X0, cls.X1, cls.half)
        planks(img, 4, 23, 2, 7)
        summoning_ring(img, 4, 2, 8, 7)
        block(img, 9, 3, 11, 6)  # hangar
        block(img, 16, 3, 20, 6, spikes=True)
        eye(img, 18, 4, 1)
        window(img, 20, 4, 5)
        grate(img, 21, 4, 2, 2)
        ram(img, cls.X1, cy, cls.half, spikes=(3, 6))
        ballista(img, 23, cy, arm=1)
        sail(img, 12, 0, 9, seed=11, depth=4)


class Burke(Ship):
    """Iron destroyer (the Arleigh Burke): riveted iron plating, twin forge-chimneys, a tattered
    sail, a spiked keep with the Eye, bolt grates fore and aft and a heavy bow ballista."""

    NAME = "burke"
    FRAME = (32, 10)
    X0, X1, HW, BOW = 3, 31, 4, 9

    @classmethod
    def draw(cls, img, f=0):
        cy = 5
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, deck=PLATE)
        plating(img, 4, 29, 2, 7)
        summoning_ring(img, 4, 2, 8, 7)
        grate(img, 9, 3, 2, 4)
        block(img, 15, 2, 22, 7, spikes=True)
        forge(img, 16, 3, 17, 6)
        eye(img, 20, 4, 1)
        window(img, 22, 3, 6)
        grate(img, 23, 3, 2, 4)
        ram(img, cls.X1, cy, cls.half, spikes=(3, 6))
        ballista(img, 26, cy, arm=2, big=True)
        sail(img, 11, 0, 9, seed=23, depth=4)


class Sub(Ship):
    """The Deep Watcher (the Virginia-class sub). 0-1 surfaced (black iron hull with spined back,
    a red Eye on the sail, wake); 2-3 submerged (translucent dark shape under the water with just a
    periscope feather)."""

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
    def draw(cls, img, f=0):
        cy = 4
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, rim=C["iron"], deck=C["iron"], lit=C["smoke"],
                   shade=C["black"])
        for x in range(8, 21):
            px(img, x, 3, C["stone_dk"])  # spine
        for x in range(8, 14, 2):
            px(img, x, 2, C["smoke_lt"])  # dorsal spines
        for x in range(19, 22, 2):
            px(img, x, 2, C["smoke_lt"])
        for y in (1, 6):  # cruciform stern planes + screw
            px(img, 4, y, C["iron"])
        px(img, 4, 2, C["iron"])
        px(img, 4, 5, C["iron"])
        px(img, 2, 3, C["stone_dk"])
        px(img, 2, 4, C["stone_dk"])
        rect(img, 15, 3, 17, 4, C["black"])  # sail
        rect(img, 15, 3, 17, 3, C["stone_dk"])
        px(img, 16, 2, C["iron"])
        px(img, 16, 5, C["iron"])
        eye(img, 16, 4, 0)
        px(img, 23, 3, C["smoke_lt"])  # ram tip
        px(img, 23, 4, C["smoke"])

    @classmethod
    def frame(cls, f):
        cy = 4
        if f < 2:
            return finish(cls.body(f), cls.X0, cls.X1, cy, cls.half, f, spray_n=3)
        # submerged: dark translucent silhouette, no outline, periscope feather + a faint red glint
        body = new(*cls.FRAME)
        for x in range(cls.X0, cls.X1 + 1):
            k = cls.half(x)
            for y in range(cy - k, cy + k):
                edge = y == cy - k or y == cy + k - 1 or x in (cls.X0, cls.X1)
                body.putpixel((x, y), a(C["water_dk"] if edge else C["black"], 110 if edge else 125))
        rect(body, 15, 3, 17, 4, a(C["black"], 150))
        px(body, 16, 4, a(C["tie"], 120))
        ph = f - 2
        px(body, 17, 3, C["smoke_lt"])
        px(body, 18, 3, a(C["white"], 230))
        for i, (x, y) in enumerate([(16, 2), (16, 4), (14, 2 - ph), (14, 5 + ph), (12, 1), (12, 6)]):
            px(body, x - ph, y, a(C["foam"], 210 - i * 25))
        return body


class Tico(Ship):
    """Iron cruiser (the Ticonderoga): riveted plating, two spiked keeps with the Eye, forge
    chimneys between, two tattered sails, ballistae fore and aft and bolt grates."""

    NAME = "tico"
    FRAME = (36, 12)
    X0, X1, HW, BOW = 3, 35, 5, 11
    STERN = 1

    @classmethod
    def draw(cls, img, f=0):
        cy = 6
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, deck=PLATE)
        plating(img, 4, 32, 2, 9)
        # aft ballista pointing aft
        rect(img, 5, 5, 6, 6, C["smoke"])
        px(img, 5, 5, C["smoke_lt"])
        px(img, 4, 5, C["wood"])
        px(img, 3, 5, C["smoke_lt"])
        px(img, 5, 3, C["wood"])
        px(img, 5, 8, C["wood"])
        grate(img, 8, 4, 2, 4)
        block(img, 12, 3, 16, 8, spikes=True)  # aft keep
        eye(img, 14, 5, 1)
        forge(img, 18, 4, 19, 7)
        block(img, 23, 3, 27, 8, spikes=True)  # forward keep with the bridge
        eye(img, 25, 5, 1)
        window(img, 27, 4, 7)
        grate(img, 28, 4, 2, 4)
        ram(img, cls.X1, cy, cls.half, spikes=(3, 6, 9))
        ballista(img, 31, cy, arm=2, big=True)
        sail(img, 9, 0, 11, seed=31, depth=4)
        sail(img, 20, 0, 11, seed=37, depth=4)


class Lhd(Ship):
    """Iron assault barge (the Wasp LHD): full-length plated deck, a spiked keep-island to
    starboard (south) with a tattered sail, Eye-marked landing spots, a parked fell-beast and two
    bat-winged drakes, and a ram."""

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
    def draw(cls, img, f=0):
        cy = 8
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, deck=PLATE)
        plating(img, 4, 44, 2, 13, step=5)
        for x in range(5, 43, 3):  # dashed centreline in dried-blood red
            px(img, x, cy, C["maroon"])
            px(img, x + 1, cy, C["maroon"])
        # Eye-marked landing spots along the port side
        for sx in range(8, 40, 8):
            eye(img, sx, 4, 0)
        # spiked keep-island on the starboard side
        block(img, 25, 10, 34, 13, spikes=True)
        forge(img, 27, 11, 28, 12)
        eye(img, 31, 11, 1)
        window(img, 34, 11, 12)
        # deck-edge lift
        rect(img, 14, 12, 18, 13, C["black"])
        rect(img, 14, 12, 18, 12, C["iron"])
        # parked drakes (tiny bat-winged shapes facing east) and a great Eye on the bow deck
        for dx, dy in ((11, 9), (33, 6)):
            drake(img, dx, dy)
        eye(img, 40, cy - 1, 2)
        ram(img, cls.X1, cy, cls.half, spikes=(3, 6))
        sail(img, 21, 6, 15, seed=41, depth=4)


class Carrier(Ship):
    """Iron supercarrier (the Nimitz): vast riveted deck with an angled landing strip in blood
    red, bolt catapults, a spiked keep-island to starboard with two tattered sails, a great Eye on
    the bow and parked bat-winged drakes."""

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
    def body(cls, f=0):
        img = new(*cls.FRAME)
        cy = cls.CY
        paint_hull2(img, cy, cls.X0, cls.X1, cls.top, cls.bot, RIM, PLATE, LIT, SHADE)
        plating(img, 4, 61, 2, 18, step=5)
        # angled landing strip: dark edges and a red dashed centreline toward the port bow
        for x in range(4, 44):
            yc = cy + 1 - (x - 4) / 6.0
            for d in range(-3, 4):
                y = round(yc + d)
                if img.getpixel((x, y))[3] and img.getpixel((x, y)) != RIM and img.getpixel((x, y)) != LIT:
                    if abs(d) == 3:
                        px(img, x, y, C["black"])
                    elif d == 0 and (x // 2) % 2 == 0:
                        px(img, x, y, C["maroon"])
                    elif abs(d) < 3:
                        px(img, x, y, C["iron"])
        for x in (11, 13, 15):  # arrestor chains
            yc = cy + 1 - (x - 4) / 6.0
            for d in range(-2, 3):
                px(img, x, round(yc + d), C["smoke"])
        # bow bolt catapults
        for y in (cy - 3, cy + 1):
            for x in range(46, 58):
                px(img, x, y, C["black"])
            px(img, 46, y, C["fire_orange"])
        for y in (cy - 6,):  # waist catapult
            for x in range(28, 40):
                px(img, x, y - (x - 28) // 6, C["black"])
        # a great Eye painted on the bow deck
        eye(img, 52, cy - 1, 2)
        # spiked keep-island to starboard
        block(img, 37, 14, 46, 17, spikes=True)
        forge(img, 39, 15, 40, 16)
        eye(img, 43, 15, 1)
        window(img, 46, 15, 16)
        # parked drakes along the aft starboard deck and the bow
        for jx, jy in ((19, cy + 5), (25, cy + 5), (31, cy + 5), (57, cy + 4)):
            drake(img, jx, jy)
        # lifts
        rect(img, 30, 2, 34, 3, C["black"])
        rect(img, 49, 17, 52, 17, C["black"])
        ram(img, cls.X1, cy, cls.half, spikes=(4, 8))
        sail(img, 33, 10, 19, seed=53, depth=4)
        sail(img, 47, 11, 19, seed=59, depth=2)
        return img

    @classmethod
    def frame(cls, f):
        return finish(cls.body(f), cls.X0, cls.X1, cls.CY, cls.half, f, spray_n=6)


class Zumwalt(Ship):
    """Black stealth wedge (the Zumwalt): a long tumblehome hull narrowing in a straight knife
    wedge to the bow, dark iron deck with faint red seams converging along the chines, a low
    faceted keep with the Eye and no masts, flush bolt grates along both deck edges and a
    shrouded ballista forward."""

    NAME = "zumwalt"
    FRAME = (36, 10)
    X0, X1, HW, BOW = 3, 34, 4, 15

    @classmethod
    def half(cls, x):
        if x < cls.X0 or x > cls.X1:
            return 0
        if x <= 18:
            return 4
        return max(1, -(-4 * (cls.X1 - x + 1) // (cls.X1 - 18)))  # straight wedge, ceil

    @classmethod
    def draw(cls, img, f=0):
        cy = 5
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, rim=C["iron"], deck=C["stone_dk"], lit=C["stone"],
                   shade=C["black"])
        # chines: faint red seams just inside each deck edge, converging on the bow
        for x in range(5, cls.X1 - 1):
            k = cls.half(x)
            if k >= 2 and x % 3:
                px(img, x, cy - k + 1, C["maroon"])
                px(img, x, cy + k - 2, C["maroon"])
        # flush bolt grates (peripheral VLS) aft and forward of the keep
        for x0 in (6, 9, 22):
            px(img, x0, cy - 2, C["black"])
            px(img, x0 + 1, cy - 2, C["fire_red"])
            px(img, x0, cy + 1, C["fire_red"])
            px(img, x0 + 1, cy + 1, C["black"])
        rect(img, 4, cy - 1, 5, cy, C["black"])  # stern boat-ramp notch
        # low faceted keep: sloped sides meeting in a forward point
        pts = [(12, 2), (19, 2), (22, 4), (22, 5), (19, 7), (12, 7)]
        poly(img, [(x + 1, y + 1) for x, y in pts], C["black"])
        poly(img, pts, C["iron"])
        rect(img, 12, 2, 19, 3, C["smoke"])  # sunlit north facet
        px(img, 20, 3, C["smoke"])
        px(img, 21, 4, C["smoke"])
        rect(img, 12, 6, 19, 7, C["black"])  # shadowed south facet
        px(img, 20, 6, C["black"])
        rect(img, 12, 2, 12, 7, C["smoke_lt"])
        for x in (15, 18):
            px(img, x, 3, C["maroon"])
            px(img, x, 6, C["maroon"])
        eye(img, 16, 4, 0)
        window(img, 21, 5, 5)
        # shrouded ballista: a low angular gun house, no barrel showing
        rect(img, 25, cy - 1, 26, cy, C["iron"])
        px(img, 25, cy - 1, C["smoke"])
        px(img, 27, cy - 1, C["stone"])
        px(img, cls.X1, cy - 1, C["smoke_lt"])  # knife tip

    @classmethod
    def frame(cls, f):
        return finish(cls.body(f), cls.X0, cls.X1, 5, cls.half, f, spray_n=3)


class Lcac(Ship):
    """Iron hover-raft (the LCAC): a squat rectangular grey rubber skirt round an iron cargo well,
    a little Eye-marked pilot keep to starboard and two big ducted fans aft spinning in their
    shrouds; foam boils out all round the skirt."""

    NAME = "lcac"
    FRAME = (20, 10)
    X0, X1 = 4, 18
    CY = 5

    @classmethod
    def half(cls, x):
        if x < cls.X0 or x > cls.X1:
            return 0
        if x in (cls.X0, cls.X1):
            return 2
        return 3

    @classmethod
    def draw(cls, img, f=0):
        cy = cls.CY
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, rim=C["stone"], deck=C["stone"], lit=C["stone_lt"],
                   shade=C["stone_dk"])
        for x in range(5, 18, 2):  # skirt fingers
            px(img, x, cy + 2, C["stone_dk"])
        # iron deck with the open cargo well and a few orc helmets
        rect(img, 8, cy - 2, 17, cy + 1, C["iron"])
        rect(img, 10, cy - 2, 16, cy, C["black"])
        rect(img, 10, cy - 2, 16, cy - 2, C["stone_dk"])
        px(img, 11, cy - 1, C["maroon"])
        px(img, 13, cy, C["maroon"])
        px(img, 15, cy - 1, C["maroon"])
        rect(img, 17, cy - 2, 17, cy + 1, C["smoke"])  # bow ramp
        # pilot keep on the starboard side with the Eye
        rect(img, 12, cy + 1, 16, cy + 1, C["smoke"])
        eye(img, 14, cy + 1, 0)
        # two big ducted fans aft: round shrouds overhanging the skirt, blades turning
        for fy in (cy - 4, cy):
            ring = [(1, 0), (2, 0), (0, 1), (3, 1), (0, 2), (3, 2), (1, 3), (2, 3)]
            for dx, dy in ring:
                px(img, 3 + dx, fy + dy, C["smoke_lt"] if dy == 0 or (dx == 0 and dy == 1) else C["iron"])
            rect(img, 4, fy + 1, 5, fy + 2, C["black"])
            blade = ((4, fy + 1), (5, fy + 2)) if f == 0 else ((5, fy + 1), (4, fy + 2))
            for bx, by in blade:
                px(img, bx, by, C["chrome"])
        px(img, 7, cy - 2, C["tie"])  # red rudder vanes behind the fans
        px(img, 7, cy + 1, C["tie"])

    @classmethod
    def frame(cls, f):
        cy = cls.CY
        img = finish(cls.body(f), cls.X0, cls.X1, cy, cls.half, f, wake_len=3, spray_n=0)
        w, h = img.size

        def put(x, y, c):
            if 0 <= x < w and 0 <= y < h and img.getpixel((x, y))[3] == 0:
                img.putpixel((x, y), c)

        # spray boiling out from under the whole skirt
        for x in range(cls.X0 + 3, cls.X1 + 2):
            top, bot = (cy - 5, cy + 4) if (x + f) % 3 else (cy - 4 - 1, cy + 4)
            if (x + f) % 2 == 0:
                put(x, top, a(C["foam"], 210))
                put(x, bot, a(C["foam"], 210))
            elif (x + f) % 4 == 1:
                put(x, top, a(C["white"], 150))
                put(x, bot, a(C["white"], 150))
        for y in range(cy - 3, cy + 3):
            put(cls.X1 + 2, y, a(C["foam"] if (y + f) % 2 else C["white"], 170 if (y + f) % 2 else 110))
        return img


class Ohio(Sub):
    """The Leviathan (the Ohio-class missile sub): the Deep Watcher's bigger kin, a longer black
    iron hull whose hump carries a double row of ember-lit missile hatches behind the Eye-marked
    sail. 0-1 surfaced, 2-3 submerged, same convention as Sub."""

    NAME = "ohio"
    FRAME = (32, 8)
    FRAMES = 4
    X0, X1, HW, BOW = 3, 31, 3, 5
    SAIL = 22  # sail x0 (3 px wide)

    @classmethod
    def half(cls, x):
        if x < cls.X0 or x > cls.X1:
            return 0
        if x < 7:
            return max(1, 1 + (x - cls.X0) // 2)
        if x > cls.X1 - 3:
            return max(1, 3 - (x - (cls.X1 - 3)))
        return 3

    @classmethod
    def draw(cls, img, f=0):
        cy = 4
        paint_hull(img, cy, cls.X0, cls.X1, cls.half, rim=C["iron"], deck=C["iron"], lit=C["smoke"],
                   shade=C["black"])
        # the hump: a raised stone-dark deck with two rows of missile hatches
        rect(img, 8, 3, 20, 4, C["stone_dk"])
        for i, x in enumerate(range(9, 21, 2)):
            glow = C["fire_red"] if (i + f) % 3 == 0 else C["maroon"]
            px(img, x, 3, C["black"])
            px(img, x, 4, glow)
        for x in range(8, 21, 4):
            px(img, x, 2, C["smoke_lt"])  # dorsal spines along the hump edge
        for x in range(27, 30, 2):
            px(img, x, 2, C["smoke_lt"])
        for y in (1, 6):  # cruciform stern planes + screw
            px(img, 4, y, C["iron"])
        px(img, 4, 2, C["iron"])
        px(img, 4, 5, C["iron"])
        px(img, 2, 3, C["stone_dk"])
        px(img, 2, 4, C["stone_dk"])
        s = cls.SAIL
        rect(img, s, 3, s + 2, 4, C["black"])  # sail
        rect(img, s, 3, s + 2, 3, C["stone_dk"])
        px(img, s + 1, 2, C["iron"])
        px(img, s + 1, 5, C["iron"])
        eye(img, s + 1, 4, 0)
        px(img, cls.X1, 3, C["smoke_lt"])  # ram tip
        px(img, cls.X1, 4, C["smoke"])

    @classmethod
    def frame(cls, f):
        cy = 4
        if f < 2:
            return finish(cls.body(f), cls.X0, cls.X1, cy, cls.half, f, spray_n=3)
        body = new(*cls.FRAME)
        for x in range(cls.X0, cls.X1 + 1):
            k = cls.half(x)
            for y in range(cy - k, cy + k):
                edge = y == cy - k or y == cy + k - 1 or x in (cls.X0, cls.X1)
                body.putpixel((x, y), a(C["water_dk"] if edge else C["black"], 110 if edge else 125))
        s = cls.SAIL
        rect(body, s, 3, s + 2, 4, a(C["black"], 150))
        px(body, s + 1, 4, a(C["tie"], 120))
        ph = f - 2
        px(body, s + 2, 3, C["smoke_lt"])
        px(body, s + 3, 3, a(C["white"], 230))
        for i, (x, y) in enumerate([(s + 1, 2), (s + 1, 4), (s - 1, 2 - ph), (s - 1, 5 + ph), (s - 3, 1), (s - 3, 6)]):
            px(body, x - ph, y, a(C["foam"], 210 - i * 25))
        return body
