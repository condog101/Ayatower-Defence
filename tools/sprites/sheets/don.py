"""Sour-don the Orange, the Eye of Mordor-a-Lago: popup portrait for the villain.

FICTIONAL SATIRICAL CARICATURE. Sour-don the Orange is an invented cartoon villain for a parody game (a
Trump parody cast as Sauron); nothing here depicts or describes real events or statements.

Orange tan with a pale goggle-tan around small squinty eyes, swept gold hair poking out from under
a spiked black-iron Sauron helmet (with a forelock under the brim) and a flaming Eye blazing above
the spikes. Full black plate armour with spiked pauldrons, a white collar and the extra-long red
tie still showing down the breastplate, a little gold EYE badge, and a spiked mace on the right.
Background: a volcanic Mordor sky with a lava glow, Mount Doom and the dark tower.
Frames: 0 pout, 1 half open, 2 wide open, 3 blink, 4 wrath (big grin, narrowed glowing eyes,
the Eye flaring, red glow).
"""
from draw import dither, disc, ellipse, new, outline, paste, poly, px, rect, rng, strip
from palette import C

NAME = "don"
FRAME = (64, 64)
FRAMES = 5

CLEAR = (0, 0, 0, 0)


def background():
    """Mordor: a blood-red glow behind the head fading to a black sky, Mount Doom on the right,
    a dark spiked tower with a burning eye on the left, and a lava glow along the bottom."""
    img = new(64, 64, C["black"])
    rnd = rng(66)
    for y in range(64):
        for x in range(64):
            d = ((x - 32) ** 2 + ((y - 14) * 1.15) ** 2) ** 0.5
            chk = (x + y) % 2 == 0
            if d < 15:
                c = C["fire_red"] if (d < 11 or chk) else C["maroon"]
            elif d < 22:
                c = C["maroon"]
            elif d < 28:
                c = C["maroon"] if chk else C["black"]
            elif d < 32:
                c = C["maroon"] if (x % 2 == 0 and y % 2 == 0) else C["black"]
            else:
                c = C["black"]
            px(img, x, y, c)
    # horizon: lava glow rising from the bottom
    for y in range(40, 64):
        for x in range(64):
            t = (y - 40) / 24
            chk = (x + y) % 2 == 0
            if t > 0.55 or (t > 0.3 and chk):
                px(img, x, y, C["fire_orange"] if t > 0.8 and chk else C["fire_red"])
            elif t > 0.1 and chk or t > 0.3:
                px(img, x, y, C["maroon"])
    # Mount Doom on the right, glowing crater and a lava rivulet
    poly(img, [(42, 54), (53, 38), (57, 38), (64, 47), (64, 54)], C["stone_dk"])
    poly(img, [(48, 54), (53, 40), (55, 40), (52, 54)], C["iron"])
    for x in range(53, 58):
        px(img, x, 38, C["fire_orange"])
    px(img, 55, 37, C["fire_yellow"])
    for y in range(39, 50):
        px(img, 56 + (y // 3) % 2, y, C["fire_orange"] if y < 44 else C["fire_red"])
    for i, (x, y) in enumerate([(56, 34), (53, 31), (50, 29)]):
        disc(img, x, y, 1.5 + i * 0.6, C["stone_dk"])
    # the dark tower on the left: tapering black spire, forked spiked top, burning eye
    poly(img, [(2, 57), (5, 22), (6, 16), (8, 16), (9, 22), (12, 57)], C["black"])
    poly(img, [(3, 57), (5, 24), (6, 18), (7, 18), (7, 57)], C["iron"])  # lit flank
    for x, y in ((4, 14), (4, 13), (5, 15), (10, 14), (10, 13), (9, 15), (7, 12), (7, 13)):
        px(img, x, y, C["iron"])
    px(img, 6, 17, C["fire_red"])
    px(img, 7, 17, C["fire_yellow"])
    px(img, 8, 17, C["fire_red"])
    px(img, 7, 16, C["fire_orange"])
    for y in range(24, 54, 6):
        px(img, 7, y, C["fire_red"])  # lit windows
    for _ in range(12):  # rising embers
        x, y = rnd.randint(1, 62), rnd.randint(28, 52)
        px(img, x, y, C["fire_orange"] if rnd.random() < 0.6 else C["fire_yellow"])
    # frame edge
    rect(img, 0, 0, 63, 0, C["gold_dk"])
    rect(img, 0, 0, 0, 63, C["gold_dk"])
    rect(img, 0, 63, 63, 63, C["black"])
    rect(img, 63, 0, 63, 63, C["black"])
    return img


def eye_badge(img, cx, cy):
    """Small gold lapel badge with a red flaming eye."""
    disc(img, cx, cy, 2.6, C["gold"])
    px(img, cx - 2, cy - 1, C["cream"])
    rect(img, cx - 1, cy, cx + 1, cy, C["fire_orange"])
    px(img, cx, cy - 1, C["fire_red"])
    px(img, cx, cy + 1, C["fire_red"])
    px(img, cx, cy, C["black"])
    px(img, cx + 2, cy + 1, C["gold_dk"])
    px(img, cx, cy - 3, C["fire_orange"])  # flame lick


def pauldron(img, cx, side):
    """Spiked black-iron pauldron: a rounded plate with a lit rim, rivets and three short spikes."""
    cy, rx, ry = 53, 9.5, 7.0
    # spikes first so the plate overlaps their roots; they rake outward
    for bx, ln in ((cx - 4 * side, 5), (cx + 1 * side, 7), (cx + 6 * side, 5)):
        top_y = cy - ry + 1
        for t in range(ln + 1):
            x = bx + round(t * 0.6) * side
            y = round(top_y - t)
            w = max(0, (ln - t) // 2)
            for xx in range(x - w, x + w + 1):
                px(img, xx, y, C["iron"])
            px(img, x - w, y, C["smoke_lt"])
            px(img, x + w + (1 if w else 0), y, C["black"])
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(cx - 10, cx + 11):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if d <= 1:
                lit = (x - cx) + (y - cy) * 1.4 < -6
                px(img, x, y, C["smoke"] if lit else C["iron"])
                if d > 0.62 and (x - cx) + (y - cy) > 4:
                    px(img, x, y, C["black"])
    for k in range(-5, 2):
        px(img, cx + k, cy - 5 + abs(k + 2) // 3, C["smoke_lt"])  # sheen
    for x in range(cx - 6, cx + 7, 4):
        px(img, x, cy + 3, C["gold_dk"])  # rivets on a trim band
        px(img, x + 1, cy + 3, C["black"])


def body():
    img = new(64, 64)
    # breastplate + fauld
    poly(img, [(4, 63), (6, 52), (14, 47), (26, 45), (38, 45), (50, 47), (58, 52), (60, 63)], C["iron"])
    for y in range(50, 64, 4):  # plate lames
        for x in range(8, 57):
            if img.getpixel((x, y))[3]:
                px(img, x, y, C["black"])
                px(img, x, y - 1, C["smoke"] if x < 30 else C["iron"])
    for y in range(47, 64):  # lit flank of the breastplate, shaded flank opposite
        px(img, 23 - (y - 47) // 4, y, C["smoke"])
        px(img, 41 + (y - 47) // 4, y, C["black"])
    # gorget round the neck
    rect(img, 22, 42, 42, 46, C["iron"])
    rect(img, 22, 42, 42, 42, C["smoke"])
    rect(img, 22, 46, 42, 46, C["black"])
    # white collar V and the extra-long red tie down the breastplate
    poly(img, [(27, 44), (37, 44), (32, 54)], C["white"])
    poly(img, [(27, 44), (31, 47), (29, 49)], C["smoke_lt"])
    poly(img, [(37, 44), (33, 47), (35, 49)], C["smoke_lt"])
    rect(img, 31, 46, 33, 48, C["tie"])
    poly(img, [(31, 49), (33, 49), (35, 63), (29, 63)], C["tie"])
    px(img, 31, 46, C["fire_orange"])
    for y in range(51, 63, 3):
        px(img, 32, y, C["maroon"])
    # neck
    rect(img, 26, 39, 38, 42, C["skin_dk"])
    eye_badge(img, 41, 54)
    pauldron(img, 10, -1)
    pauldron(img, 54, 1)
    mace(img)
    return img


def mace(img):
    """Spiked mace on the right: steel flanged head beside the face, timber haft, gauntlet."""
    x = 58
    rect(img, x, 34, x + 1, 63, C["wood_dk"])
    rect(img, x, 34, x, 63, C["wood"])
    for y in (41, 44):  # leather grip wraps
        px(img, x, y, C["maroon"])
        px(img, x + 1, y, C["maroon"])
    cx, cy = 58.5, 28.5
    for dx, dy in ((0, -6), (0, 6), (-6, 0), (6, 0), (-4, -4), (4, -4), (-4, 4), (4, 4)):
        for t in range(3):
            c = C["smoke_lt"] if t == 0 else C["smoke"]
            px(img, round(cx + dx * (1 - t * 0.2) - 0.5), round(cy + dy * (1 - t * 0.2) - 0.5), c)
    disc(img, cx, cy, 3.9, C["smoke"])
    disc(img, cx - 1, cy - 1, 2.0, C["smoke_lt"])
    px(img, 57, 26, C["white"])
    for xx, yy in ((61, 30), (60, 31), (61, 29), (59, 31)):
        px(img, xx, yy, C["iron"])
    rect(img, 57, 32, 60, 33, C["iron"])  # collar
    # gauntlet gripping the haft
    rect(img, 55, 46, 62, 50, C["iron"])
    rect(img, 55, 46, 62, 46, C["smoke"])
    for xx in (56, 58, 60):
        px(img, xx, 48, C["black"])
    px(img, 62, 49, C["black"])


def face(img):
    # ears
    ellipse(img, 15, 27, 20, 35, C["skin_dk"])
    ellipse(img, 44, 27, 49, 35, C["skin_dk"])
    px(img, 17, 30, C["skin"])
    px(img, 46, 30, C["skin"])
    # square-ish head with heavy jowls
    rect(img, 18, 18, 46, 40, C["skin"])
    poly(img, [(18, 38), (46, 38), (43, 44), (21, 44)], C["skin"])
    for y in range(22, 44):
        px(img, 45, y, C["skin_dk"])
        px(img, 46, y, C["skin_dk"])
    rect(img, 23, 43, 41, 44, C["skin_dk"])
    for y in range(36, 43):
        px(img, 44, y, C["skin_dk"])
    # pale goggle-tan around the eyes
    ellipse(img, 21, 25, 29, 31, C["skin_lt"])
    ellipse(img, 35, 25, 43, 31, C["skin_lt"])
    # cheek blush
    dither(img, 21, 34, 25, 36, C["fire_orange"])
    dither(img, 39, 34, 43, 36, C["fire_orange"])
    # nose
    rect(img, 31, 29, 33, 35, C["skin"])
    rect(img, 33, 30, 34, 35, C["skin_dk"])
    px(img, 30, 35, C["skin_dk"])
    px(img, 32, 36, C["skin_dk"])
    px(img, 31, 30, C["skin_lt"])
    # chin crease
    rect(img, 29, 43, 35, 43, C["skin_dk"])


def eyes(img, mode):
    """mode: 'open' (small squinty eyes), 'blink', 'narrow' (wrath: glowing red slits)."""
    # brows: gold, furrowed down toward the nose
    for x0, slope in ((21, 1), (35, -1)):
        for i in range(8):
            y = 25 + (i // 4 if slope > 0 else (7 - i) // 4)
            if mode == "narrow":
                y = 25 + (i // 3 if slope > 0 else (7 - i) // 3)
            px(img, x0 + i, y, C["gold_dk"])
    for cx in (25, 39):
        if mode == "blink":
            rect(img, cx - 2, 28, cx + 1, 28, C["skin_dk"])
            px(img, cx - 2, 27, C["skin_dk"])
            px(img, cx + 1, 27, C["skin_dk"])
        elif mode == "narrow":
            rect(img, cx - 2, 28, cx + 1, 28, C["black"])
            px(img, cx - 1, 28, C["fire_red"])
            px(img, cx, 28, C["fire_yellow"])
            rect(img, cx - 2, 27, cx + 1, 27, C["skin_dk"])
        else:
            rect(img, cx - 2, 28, cx + 1, 29, C["white"])
            px(img, cx, 28, C["night"])
            px(img, cx - 1, 28, C["night"])
            px(img, cx - 1, 29, C["black"])
            px(img, cx, 29, C["black"])
            rect(img, cx - 2, 27, cx + 1, 27, C["skin_dk"])  # heavy lids
            px(img, cx - 3, 28, C["skin_dk"])
            px(img, cx + 2, 28, C["skin_dk"])
            rect(img, cx - 1, 30, cx + 1, 30, C["skin_dk"])  # puffy bags


def teeth(img, x0, x1, y):
    for x in range(x0, x1 + 1):
        px(img, x, y, C["white"] if (x - x0) % 2 == 0 else C["smoke_lt"])


def mouth(img, state):
    if state == 0:  # pursed, the classic pout
        ellipse(img, 28, 37, 36, 41, C["fire_red"])
        rect(img, 30, 39, 34, 39, C["maroon"])
        rect(img, 30, 37, 33, 37, C["skin_lt"])
    elif state == 1:
        ellipse(img, 27, 37, 37, 41, C["fire_red"])
        rect(img, 29, 38, 35, 40, C["black"])
        teeth(img, 30, 34, 38)
    elif state == 2:
        ellipse(img, 26, 36, 38, 43, C["fire_red"])
        ellipse(img, 27, 37, 37, 42, C["black"])
        teeth(img, 29, 35, 37)
        ellipse(img, 29, 40, 35, 42, C["tie"])  # tongue
    else:  # wide grin, all teeth
        ellipse(img, 25, 36, 39, 42, C["fire_red"])
        rect(img, 27, 38, 37, 40, C["black"])
        teeth(img, 27, 37, 38)
        teeth(img, 28, 36, 39)
        px(img, 25, 38, C["skin_dk"])
        px(img, 39, 38, C["skin_dk"])


def hair(img):
    """Swept gold hair: big side tufts poking out under the helmet and a forelock under the brim."""
    hair, dk, hl = C["gold"], C["gold_dk"], C["fire_yellow"]
    # side volume behind the ears, wider than the head
    poly(img, [(11, 17), (19, 17), (20, 30), (16, 31), (12, 26)], hair)
    poly(img, [(45, 17), (53, 17), (53, 25), (49, 30), (45, 29)], hair)
    for x, y in ((12, 20), (13, 23), (14, 26), (52, 20), (51, 23), (50, 26)):
        px(img, x, y, dk)
    for x, y in ((14, 18), (15, 20), (49, 18), (48, 20)):
        px(img, x, y, hl)
    # forehead under the brim
    rect(img, 20, 20, 44, 25, C["skin"])
    rect(img, 22, 24, 42, 24, C["skin_dk"])  # forehead furrow
    # the forelock: sweeps left-to-right from under the brim and curls past the right temple
    poly(img, [(18, 20), (30, 20), (44, 20), (51, 22), (50, 26), (45, 24), (36, 23), (24, 24), (19, 23)], hair)
    for x in range(21, 49):
        y = 23 if x < 38 else 23 + (x - 38) // 4
        px(img, x, y, dk)
    for x in range(22, 40, 3):
        px(img, x, 21, hl)
        px(img, x + 1, 21, hl)
    px(img, 50, 26, dk)


def helmet(img):
    """Spiked black-iron helmet: tall dome, riveted brim band and a crown of long spikes."""
    iron, dk, hl, hl2 = C["iron"], C["black"], C["smoke"], C["smoke_lt"]
    # crown of spikes (drawn first so the dome overlaps their roots)
    spikes = [(14, 8, 2), (20, 4, 3), (26, 3, 2), (38, 3, 2), (44, 4, 3), (50, 8, 2)]
    for sx, top, hw in spikes:
        poly(img, [(sx - hw, 14), (sx, top), (sx + hw, 14)], iron)
        for y in range(top + 1, 14):
            k = (y - top) * hw / (14 - top)
            px(img, round(sx - k), y, hl2 if y < top + 4 else hl)  # lit left edge
            px(img, round(sx + k), y, dk)
        px(img, sx, top, hl2)
    # dome: upper half of an ellipse, sitting on the brim
    for y in range(6, 18):
        for x in range(13, 52):
            if ((x - 32) / 19.0) ** 2 + ((y - 18) / 12.0) ** 2 <= 1:
                px(img, x, y, iron)
    for x in range(19, 30):
        px(img, x, 9 if x > 22 else 10, hl)  # top-left sheen
    for x in range(15, 19):
        px(img, x, 13 - (x - 15) // 2, hl)
    for y in range(8, 17):  # shaded right side of the dome
        for x in range(40, 52):
            if img.getpixel((x, y)) == iron and (x + y) % 2 == 0:
                px(img, x, y, dk)
    # brim band with gold rivets
    rect(img, 12, 17, 52, 20, C["stone_dk"])
    rect(img, 12, 17, 52, 17, hl)
    rect(img, 12, 20, 52, 20, dk)
    for x in range(15, 51, 5):
        px(img, x, 18, C["gold"])
        px(img, x, 19, C["gold_dk"])
    # nose-guard point with a red gem
    poly(img, [(30, 20), (34, 20), (32, 23)], C["stone_dk"])
    px(img, 32, 21, C["fire_red"])
    px(img, 31, 20, C["fire_orange"])


def eye_flame(img, f, wrath=False):
    """The flaming Eye hovering above the helmet between the spikes."""
    cx, cy = 32, 6
    h = 7 if wrath else 6
    for y in range(0, 11):
        for x in range(25, 40):
            dx = (x - cx + 0.5) / (6.5 if wrath else 5.5)
            dy = (y - cy) / h
            jag = 0.18 * ((x * 5 + y * 3 + f * 2) % 3 - 1)
            d = (dx * dx + dy * dy) ** 0.5
            if y < cy:  # flames lick upward into points
                d = (dx * dx * (1 + (cy - y) * 0.25) + dy * dy) ** 0.5
            if d < 1.0 + jag:
                px(img, x, y, C["fire_red"] if d > 0.75 else C["fire_orange"])
    # almond eye with a slit pupil
    for x in range(27, 38):
        u = (x - cx + 0.5) / 5.5
        lim = 2.2 * max(0.0, 1 - u * u) ** 0.8
        for y in range(3, 10):
            if abs(y - cy - 0.5) <= lim:
                px(img, x, y, C["fire_yellow"] if abs(x - cx + 0.5) > 1.5 else C["white"])
    rect(img, 31, 4, 32, 8, C["black"])
    px(img, 31, 3, C["maroon"])
    px(img, 32, 9, C["maroon"])


def figure(state, eye_mode="open", f=0):
    img = body()
    face(img)
    hair(img)
    helmet(img)
    eye_flame(img, f, wrath=(eye_mode == "narrow"))
    eyes(img, eye_mode)
    mouth(img, state)
    return outline(img)


def red_glow(bg, fig):
    """Wrath: a red/orange aura hugging the silhouette."""
    out = bg.copy()
    w, h = fig.size
    for y in range(h):
        for x in range(w):
            if fig.getpixel((x, y))[3]:
                continue
            near = 99
            for dy in range(-3, 4):
                for dx in range(-3, 4):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and fig.getpixel((nx, ny))[3]:
                        near = min(near, max(abs(dx), abs(dy)))
            if near == 1:
                px(out, x, y, C["fire_orange"])
            elif near == 2:
                px(out, x, y, C["fire_red"])
            elif near == 3 and (x + y) % 2 == 0:
                px(out, x, y, C["fire_red"])
    return out


def frame(i):
    bg = background()
    if i == 3:
        fig = figure(0, "blink")
    elif i == 4:
        fig = figure(3, "narrow", f=1)
        bg = red_glow(bg, fig)
    else:
        fig = figure(i, f=i % 2)
    paste(bg, fig, 0, 0)
    return bg


def build():
    return strip([frame(i) for i in range(FRAMES)])
