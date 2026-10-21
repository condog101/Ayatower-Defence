"""Stone beacon tower (the beacons of Gondor, lit when a wave starts), 16x16 transparent.

  0 unlit: crenellated slate tower with a stacked log pyre on top
  1-3 lit: the pyre ablaze, three flicker frames (the game loops 1-3 and tweens the sprite)
"""
from draw import blob, new, outline, poly, px, rect, strip
from palette import C

NAME = "beacon"
FRAME = (16, 16)
FRAMES = 4

SHADOW = (*C["black"][:3], 80)


def a(c, alpha):
    return (*c[:3], alpha)


def tower(lit):
    img = new(16, 16)
    rect(img, 7, 12, 14, 15, SHADOW)
    fig = new(16, 16)
    # tapering slate tower
    poly(fig, [(4, 15), (5, 8), (10, 8), (11, 15)], C["stone"])
    for y in range(8, 16):
        k = (15 - y) // 7
        px(fig, 5 - (1 if y > 11 else 0), y, C["stone_lt"])
        px(fig, 10 + (1 if y > 11 else 0), y, C["stone_dk"])
    for y in (10, 13):  # stone courses
        for x in range(4, 12):
            if (x + y) % 3 == 0:
                px(fig, x, y, C["stone_dk"])
    rect(fig, 7, 13, 8, 15, C["black"])  # door
    px(fig, 7, 13, C["stone"])
    px(fig, 8, 10, C["black"])  # slit
    # crenellated top platform
    rect(fig, 3, 7, 12, 8, C["stone_lt"])
    rect(fig, 3, 8, 12, 8, C["stone"])
    for x in (3, 6, 9, 12):
        px(fig, x, 6, C["stone_lt"])
    rect(fig, 12, 7, 12, 8, C["stone_dk"])
    # log pyre
    rect(fig, 5, 5, 10, 6, C["wood"])
    rect(fig, 6, 4, 9, 4, C["wood_dk"])
    px(fig, 7, 3, C["wood"])
    px(fig, 8, 3, C["wood_dk"])
    for x in (5, 7, 9):
        px(fig, x, 5, C["parch_dk"])  # log ends
    if lit:
        for x in range(4, 12):
            if fig.getpixel((x, 7))[3] and x % 2 == 0:
                px(fig, x, 7, C["fire_orange"])  # firelight on the parapet
        px(fig, 5, 9, C["fire_orange"])
    outline(fig)
    img.alpha_composite(fig)
    return img


FLAMES = [
    # (cx, top, sway, ember positions)
    (7.5, 0, 0, [(4, 1), (11, 2)]),
    (8.0, 1, 1, [(12, 0), (5, 3)]),
    (7.0, 0, -1, [(3, 2), (10, 0)]),
]


def flame(img, k):
    cx, top, sway, embers = FLAMES[k]
    # outer red tongue, orange body, yellow-white core
    blob(img, cx, 4.2, 3.2, [C["fire_yellow"], C["fire_orange"], C["fire_red"]], seed=11 + k)
    for y in range(top, 4):
        w = (y - top) * 0.6 + 0.5
        x0 = cx + sway * (4 - y) * 0.4
        for x in range(round(x0 - w), round(x0 + w) + 1):
            px(img, x, y, C["fire_orange"] if abs(x - x0) > w - 1 else C["fire_yellow"])
    px(img, round(cx), 4, C["white"])
    px(img, round(cx) - 1, 5, C["fire_yellow"])
    for x, y in embers:
        px(img, x, y, a(C["fire_yellow"], 220))


def frame(i):
    img = tower(lit=i > 0)
    if i > 0:
        flame(img, i - 1)
    else:
        px(img, 8, 1, a(C["smoke_lt"], 90))  # a cold wisp
    return img


def build():
    return strip([frame(i) for i in range(FRAMES)])
