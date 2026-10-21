"""Map dressing, 16x16 transparent, light from the top-left with soft shadows down-right:

  0 palm (shaggy fronds on a ringed trunk)
  1 stone hamlet: timber-roofed stone cottage with a small turquoise Persian dome
  2 minaret with burning torches on its balcony
  3 ruined sea-tower: an Umbar-style wreck (broken tower stump + black corsair hull ribs and a
    torn sail) standing in the water
  4 cypress / pine (tall dark spire)
  5 standing stones (a trilithon and a lone menhir, mossy)
"""
from draw import disc, ellipse, new, outline, poly, px, rect, strip
from palette import C

NAME = "decor"
FRAME = (16, 16)
FRAMES = 6

SHADOW = (*C["black"][:3], 80)


def a(c, alpha):
    return (*c[:3], alpha)


def shadow_ellipse(img, x0, y0, x1, y1):
    ellipse(img, x0, y0, x1, y1, SHADOW)


def palm():
    img = new(16, 16)
    shadow_ellipse(img, 6, 11, 14, 15)
    fig = new(16, 16)
    # curved trunk with ring segments
    for x, y in ((7, 14), (7, 13), (7, 12), (8, 11), (8, 10), (8, 9), (8, 8), (8, 7)):
        px(fig, x, y, C["wood"])
        px(fig, x + 1, y, C["wood_dk"])
    for y in (13, 11, 9):
        px(fig, 7 if y > 11 else 8, y, C["parch_dk"])
    # date clusters under the crown
    for x, y in ((7, 7), (10, 7), (7, 8)):
        px(fig, x, y, C["fire_orange"])
    fronds = [
        [(7, 5), (6, 4), (5, 4), (4, 4), (3, 5), (2, 6)],
        [(9, 5), (10, 4), (11, 4), (12, 4), (13, 5), (14, 6)],
        [(8, 4), (8, 3), (7, 2), (6, 1)],
        [(9, 4), (10, 3), (11, 2), (12, 2)],
        [(7, 6), (6, 6), (5, 7), (4, 8), (4, 9)],
        [(10, 6), (11, 6), (12, 7), (13, 8), (13, 9)],
        [(7, 4), (5, 2), (4, 2)],
    ]
    for fr in fronds:
        for i, (x, y) in enumerate(fr):
            px(fig, x, y, C["grass"] if i < len(fr) - 1 else C["moss"])
            if i % 2 == 1:
                px(fig, x, y + 1, C["grass_dk"])  # drooping leaflets
    for x, y in ((8, 5), (9, 5), (8, 4), (9, 4)):
        px(fig, x, y, C["grass_lt"])
    px(fig, 6, 4, C["grass_lt"])
    px(fig, 10, 3, C["grass_lt"])
    outline(fig)
    img.alpha_composite(fig)
    return img


def hamlet():
    img = new(16, 16)
    rect(img, 3, 9, 15, 15, SHADOW)
    fig = new(16, 16)
    # cottage: steep timber roof (seen from above) over a fieldstone wall
    poly(fig, [(1, 9), (3, 4), (8, 4), (9, 9)], C["wood"])
    for x in range(2, 9, 2):  # shingle courses
        for y in range(5, 9):
            if (x + y) % 3 == 0:
                px(fig, x, y, C["wood_dk"])
    rect(fig, 3, 4, 8, 4, C["parch_dk"])  # ridge, lit
    px(fig, 2, 7, C["parch_dk"])
    rect(fig, 1, 9, 9, 14, C["stone_lt"])
    for y in (10, 12):  # mortar courses
        for x in range(1, 10):
            if (x + y // 2) % 3 == 0:
                px(fig, x, y, C["stone"])
    rect(fig, 9, 10, 9, 14, C["stone"])
    rect(fig, 4, 11, 5, 14, C["wood_dk"])  # door
    px(fig, 4, 11, C["wood"])
    px(fig, 7, 11, C["fire_yellow"])  # lamplit window
    px(fig, 7, 12, C["fire_orange"])
    px(fig, 6, 3, C["stone"])  # chimney
    px(fig, 6, 2, C["smoke_lt"])
    # domed annex: sandstone drum with a turquoise Persian dome and a gold finial
    rect(fig, 10, 9, 14, 14, C["parch"])
    rect(fig, 10, 9, 14, 9, C["cream"])
    rect(fig, 14, 10, 14, 14, C["parch_dk"])
    rect(fig, 11, 11, 12, 14, C["iron"])  # arched door
    px(fig, 11, 11, C["parch"])
    rect(fig, 10, 8, 14, 8, C["gold_dk"])  # drum band
    disc(fig, 12, 6.5, 2.7, C["shallow"])
    px(fig, 11, 5, C["foam"])
    px(fig, 10, 6, C["foam"])
    px(fig, 13, 7, C["water_lt"])
    px(fig, 14, 6, C["water_lt"])
    px(fig, 12, 3, C["gold"])
    px(fig, 12, 2, C["gold"])
    outline(fig)
    img.alpha_composite(fig)
    return img


def torch(img, x, y, flick=0):
    px(img, x, y + 2, C["iron"])  # bracket
    px(img, x, y + 1, C["wood"])
    px(img, x, y, C["fire_yellow"])
    px(img, x, y - 1, C["fire_orange"])
    px(img, x + (1 if flick else -1), y - 1, a(C["fire_red"], 200))


def minaret():
    img = new(16, 16)
    rect(img, 8, 11, 14, 15, SHADOW)
    fig = new(16, 16)
    # plinth
    rect(fig, 4, 12, 11, 14, C["stone_lt"])
    rect(fig, 4, 12, 11, 12, C["chrome"])
    rect(fig, 11, 13, 11, 14, C["stone"])
    rect(fig, 7, 13, 8, 14, C["iron"])  # door
    # slender shaft with turquoise tile bands
    rect(fig, 6, 4, 9, 12, C["stone_lt"])
    rect(fig, 6, 4, 6, 12, C["chrome"])
    rect(fig, 9, 4, 9, 12, C["stone"])
    for y in (9, 11):
        rect(fig, 6, y, 9, y, C["shallow"])
    px(fig, 7, 8, C["black"])  # window slit
    # balcony
    rect(fig, 4, 6, 11, 6, C["stone"])
    rect(fig, 4, 5, 11, 5, C["stone_lt"])
    # pointed turquoise cap + gold finial
    rect(fig, 6, 3, 9, 4, C["shallow"])
    rect(fig, 7, 2, 8, 2, C["shallow"])
    px(fig, 6, 3, C["foam"])
    px(fig, 7, 2, C["foam"])
    px(fig, 9, 4, C["water_lt"])
    px(fig, 7, 1, C["gold"])
    px(fig, 7, 0, C["gold"])
    outline(fig)
    img.alpha_composite(fig)
    # torches drawn after the outline so the flames glow over it
    torch(img, 3, 3, 0)
    torch(img, 12, 3, 1)
    torch(img, 4, 10, 1)
    torch(img, 11, 10, 0)
    return img


def sea_tower():
    img = new(16, 16)
    # foam where the ruins meet the sea
    for x, y in ((1, 13), (2, 14), (4, 15), (6, 14), (8, 15), (9, 14), (11, 13), (13, 14), (15, 13), (12, 15)):
        px(img, x, y, a(C["foam"], 200))
    for x, y in ((0, 12), (3, 15), (7, 15), (10, 15), (14, 15)):
        px(img, x, y, a(C["white"], 150))
    fig = new(16, 16)
    # broken tower stump: round wall, jagged top, dark hollow inside
    rect(fig, 1, 6, 8, 13, C["stone_lt"])
    rect(fig, 7, 6, 8, 13, C["stone"])
    rect(fig, 1, 6, 1, 13, C["chrome"])
    for y in (7, 10):
        for x in range(1, 9):
            if (x + y) % 3 == 0:
                px(fig, x, y, C["stone_dk"])
    top = [3, 2, 4, 5, 3, 4, 6, 5]  # jagged broken rim heights per column
    for i, t in enumerate(top):
        x = 1 + i
        rect(fig, x, t, x, 6, C["stone_lt"] if i < 6 else C["stone"])
    rect(fig, 2, 6, 6, 7, C["black"])  # the hollow
    px(fig, 3, 4, C["stone_dk"])
    px(fig, 5, 4, C["stone_dk"])
    rect(fig, 4, 9, 4, 11, C["black"])  # arched window
    px(fig, 6, 8, C["stone_dk"])  # crack
    px(fig, 5, 7, C["stone_dk"])
    for x in range(1, 9):  # weed + wet stone at the waterline
        px(fig, x, 13, C["moss"] if x % 2 else C["grass_dk"])
        px(fig, x, 12, C["moss"] if x % 3 == 0 else C["stone"])
    # black corsair hull ribs rising from the water, a snapped mast with a torn red sail
    for i, x in enumerate((10, 12, 14)):
        rect(fig, x, 9 + i % 2, x, 13, C["iron"])
        px(fig, x, 8 + i % 2, C["wood_dk"])
    rect(fig, 10, 12, 15, 13, C["iron"])
    rect(fig, 10, 12, 15, 12, C["wood_dk"])
    for k in range(6):  # leaning mast
        px(fig, 12 + k // 3, 11 - k, C["wood"])
    poly(fig, [(13, 5), (15, 4), (15, 7), (14, 8)], C["maroon"])
    px(fig, 14, 6, C["tie"])
    px(fig, 15, 8, C["maroon"])
    outline(fig)
    img.alpha_composite(fig)
    return img


def cypress():
    img = new(16, 16)
    shadow_ellipse(img, 7, 12, 14, 15)
    fig = new(16, 16)
    # tall flame-shaped spire: half-width per row
    widths = [0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2]
    cx = 8
    for y, w in enumerate(widths):
        for x in range(cx - w, cx + w + 1):
            px(fig, x, y, C["grass_dk"])
        if w >= 1:
            px(fig, cx - w, y, C["grass"])  # lit left flank
        if w >= 2:
            px(fig, cx - w + 1, y, C["grass"] if y % 3 else C["grass_lt"])
    # foliage texture: moss and highlight flecks, deep shade on the right
    for x, y in ((7, 3), (6, 6), (7, 8), (6, 10), (8, 5), (7, 11)):
        px(fig, x, y, C["grass_lt"])
    for x, y in ((9, 4), (10, 7), (10, 9), (9, 12), (11, 10), (9, 8)):
        px(fig, x, y, C["moss"])
    rect(fig, 8, 14, 8, 15, C["wood"])
    px(fig, 9, 14, C["wood_dk"])
    outline(fig)
    img.alpha_composite(fig)
    return img


def menhir(fig, x0, y0, x1, y1):
    rect(fig, x0, y0, x1, y1, C["stone"])
    rect(fig, x0, y0, x0, y1, C["stone_lt"])
    rect(fig, x0, y0, x1 - 1, y0, C["stone_lt"])
    rect(fig, x1, y0 + 1, x1, y1, C["stone_dk"])
    px(fig, x1, y0, (0, 0, 0, 0))


def standing_stones():
    img = new(16, 16)
    for x0, y0, x1, y1 in ((3, 11, 11, 15), (11, 12, 15, 15)):
        rect(img, x0, y0, x1, y1, SHADOW)
    fig = new(16, 16)
    # trilithon: two uprights and a lintel
    menhir(fig, 2, 5, 4, 13)
    menhir(fig, 8, 5, 10, 13)
    rect(fig, 1, 3, 11, 5, C["stone"])
    rect(fig, 1, 3, 11, 3, C["stone_lt"])
    rect(fig, 1, 5, 11, 5, C["stone_dk"])
    px(fig, 11, 3, C["stone"])
    # lone leaning menhir to the right
    menhir(fig, 12, 8, 14, 14)
    px(fig, 12, 7, C["stone_lt"])
    px(fig, 13, 7, C["stone"])
    # moss and lichen
    for x, y in ((2, 12), (3, 13), (9, 12), (8, 13), (13, 13), (6, 3), (4, 4), (12, 9), (2, 8)):
        px(fig, x, y, C["moss"] if (x + y) % 2 else C["grass"])
    # faint carved spiral on the near upright
    px(fig, 9, 8, C["stone_dk"])
    px(fig, 9, 9, C["mithril"])
    # grass at the feet
    for x in (1, 5, 7, 11, 15):
        px(fig, x, 14, C["grass"])
        px(fig, x, 15, C["grass_dk"])
    outline(fig)
    img.alpha_composite(fig)
    return img


def build():
    return strip([palm(), hamlet(), minaret(), sea_tower(), cypress(), standing_stones()])
