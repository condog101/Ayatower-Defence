"""Map dressing, 16x16 transparent, light from the top-left with soft shadows down-right:
0 date palm, 1 Persian village house with a badgir (wind tower), 2 mosque (turquoise dome +
minaret), 3 offshore oil platform standing in the water."""
from draw import disc, ellipse, new, outline, px, rect, strip
from palette import C

NAME = "decor"
FRAME = (16, 16)
FRAMES = 4

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
        px(fig, x + 1, y, C["rock"])
    for y in (13, 11, 9):
        px(fig, 7 if y > 11 else 8, y, C["rock_lt"])
    # date clusters under the crown
    for x, y in ((7, 7), (10, 7), (7, 8)):
        px(fig, x, y, C["soil"])
    # fronds: arching lines out from the crown at (8, 5)
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
            px(fig, x, y, C["green"] if i < len(fr) - 1 else C["olive"])
            if i % 2 == 1:
                px(fig, x, y + 1, C["olive"])  # drooping leaflets
    for x, y in ((8, 5), (9, 5), (8, 4), (9, 4)):
        px(fig, x, y, C["olive_lt"])
    px(fig, 6, 4, C["olive_lt"])
    px(fig, 10, 3, C["olive_lt"])
    outline(fig)
    img.alpha_composite(fig)
    return img


def house():
    img = new(16, 16)
    rect(img, 4, 7, 15, 15, SHADOW)
    fig = new(16, 16)
    # flat roof (top) + front wall (below), whitewashed mud-brick
    rect(fig, 2, 6, 12, 9, C["sand_lt"])
    rect(fig, 2, 6, 12, 6, C["cream"])
    rect(fig, 2, 10, 12, 14, C["sand"])
    rect(fig, 2, 10, 12, 10, C["sand_dk"])  # roof parapet edge
    rect(fig, 12, 10, 12, 14, C["sand_dk"])
    # door + windows
    rect(fig, 6, 11, 7, 14, C["wood"])
    px(fig, 6, 11, C["rock"])
    px(fig, 4, 12, C["rock_dk"])
    px(fig, 10, 12, C["rock_dk"])
    # badgir wind tower on the back-left corner
    rect(fig, 3, 1, 6, 9, C["sand"])
    rect(fig, 3, 1, 6, 1, C["cream"])
    rect(fig, 3, 1, 3, 9, C["sand_lt"])
    for y in (3, 5, 7):  # vent slots
        px(fig, 4, y, C["rock_dk"])
        px(fig, 5, y, C["rock_dk"])
    rect(fig, 6, 2, 6, 9, C["sand_dk"])
    # rooftop clutter: water tank and a rug drying
    rect(fig, 9, 7, 10, 8, C["water_lt"])
    px(fig, 9, 7, C["foam"])
    rect(fig, 8, 6, 11, 6, C["tie"])
    px(fig, 9, 6, C["fire_yellow"])
    outline(fig)
    img.alpha_composite(fig)
    return img


def mosque():
    img = new(16, 16)
    rect(img, 3, 8, 15, 15, SHADOW)
    fig = new(16, 16)
    # prayer hall: roof + front wall with arched door
    rect(fig, 1, 8, 11, 10, C["sand_lt"])
    rect(fig, 1, 11, 11, 14, C["sand"])
    rect(fig, 1, 11, 11, 11, C["sand_dk"])
    rect(fig, 5, 12, 7, 14, C["water_dk"])  # arched portal with tile surround
    px(fig, 6, 11, C["water_lt"])
    px(fig, 4, 12, C["water_lt"])
    px(fig, 8, 12, C["water_lt"])
    px(fig, 5, 12, C["water_lt"])
    px(fig, 7, 12, C["water_lt"])
    # turquoise onion dome
    disc(fig, 6, 6.5, 3.6, C["water_lt"])
    rect(fig, 3, 8, 9, 9, C["water_lt"])
    for x, y in ((4, 4), (5, 3), (4, 5), (3, 6)):
        px(fig, x, y, C["shallow"])
    px(fig, 5, 4, C["foam"])
    for x, y in ((8, 8), (9, 7), (9, 8), (8, 9), (9, 9)):
        px(fig, x, y, C["water"])
    rect(fig, 3, 9, 9, 9, C["gold_dk"])  # drum band
    px(fig, 6, 2, C["gold"])  # finial
    px(fig, 6, 1, C["gold"])
    # minaret on the right with a turquoise cap and a balcony
    rect(fig, 12, 3, 13, 14, C["sand_lt"])
    rect(fig, 13, 3, 13, 14, C["sand_dk"])
    rect(fig, 11, 6, 14, 6, C["sand"])
    px(fig, 12, 8, C["water_dk"])
    px(fig, 12, 11, C["water_dk"])
    rect(fig, 12, 1, 13, 2, C["water_lt"])
    px(fig, 12, 0, C["gold"])
    px(fig, 12, 1, C["shallow"])
    outline(fig)
    img.alpha_composite(fig)
    return img


def platform():
    img = new(16, 16)
    # foam rings where the four legs enter the water
    for lx, ly in ((3, 13), (11, 13), (3, 7), (11, 7)):
        for dx, dy in ((-1, 1), (1, 1), (0, 2), (2, 1), (-2, 1)):
            px(img, lx + dx, ly + dy, a(C["foam"], 190))
    fig = new(16, 16)
    # legs
    for lx in (3, 11):
        rect(fig, lx, 9, lx, 14, C["iron"])
    rect(fig, 4, 12, 10, 12, C["deck"])  # cross brace
    for k in range(6):
        px(fig, 4 + k, 13 - k // 2, C["deck"])
    # deck slab
    rect(fig, 1, 6, 13, 9, C["hull_dk"])
    rect(fig, 1, 6, 13, 6, C["hull"])
    rect(fig, 1, 9, 13, 9, C["deck"])
    # helipad corner
    rect(fig, 9, 5, 13, 7, C["olive_dk"])
    px(fig, 11, 6, C["fire_yellow"])
    # derrick: tapering lattice tower
    for y in range(0, 7):
        hw = 1 + y // 3
        px(fig, 5 - hw, y, C["tie"] if y % 2 == 0 else C["white"])
        px(fig, 5 + hw, y, C["tie"] if y % 2 == 0 else C["white"])
        if y % 2 == 1:
            for x in range(5 - hw, 6 + hw):
                px(fig, x, y, C["hull_dk"] if x != 5 else C["white"])
    px(fig, 5, 0, C["tie"])
    # flare boom with a flame on the right
    for k in range(3):
        px(fig, 13 + k, 5 - k, C["smoke"])
    outline(fig)
    img.alpha_composite(fig)
    px(img, 15, 1, C["fire_yellow"])
    px(img, 15, 0, C["fire_orange"])
    px(img, 14, 1, C["fire_orange"])
    return img


def build():
    return strip([palm(), house(), mosque(), platform()])
