"""Big Don, the Eye of Mordor-a-Lago: popup portrait for the villain.

FICTIONAL SATIRICAL CARICATURE. Big Don is an invented cartoon villain for a parody game (a
Trump parody cast as Sauron); nothing here depicts or describes real events or statements.

Orange tan with a pale goggle-tan around small squinty eyes, swept gold hair poking out from under
a spiked black-iron Sauron helmet (with a forelock under the brim), dark suit, extra-long red tie
and a little gold EYE lapel badge. Background: a volcanic Mordor sky with a lava glow and a
distant dark tower. Frames: 0 pout, 1 half open, 2 wide open, 3 blink, 4 hype (big grin, narrowed
glowing eyes, red glow).
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
    poly(img, [(42, 54), (53, 38), (57, 38), (64, 47), (64, 54)], C["rock_dk"])
    poly(img, [(48, 54), (53, 40), (55, 40), (52, 54)], C["iron"])
    for x in range(53, 58):
        px(img, x, 38, C["fire_orange"])
    px(img, 55, 37, C["fire_yellow"])
    for y in range(39, 50):
        px(img, 56 + (y // 3) % 2, y, C["fire_orange"] if y < 44 else C["fire_red"])
    for i, (x, y) in enumerate([(56, 34), (53, 31), (50, 29)]):
        disc(img, x, y, 1.5 + i * 0.6, C["rock_dk"])
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


def body():
    img = new(64, 64)
    # suit shoulders
    poly(img, [(4, 63), (6, 52), (14, 47), (26, 45), (38, 45), (50, 47), (58, 52), (60, 63)], C["suit"])
    dither(img, 6, 50, 14, 63, C["iron"])
    # lapels
    lapel = (44, 50, 78, 255)
    poly(img, [(25, 45), (31, 60), (27, 63), (20, 50)], lapel)
    poly(img, [(39, 45), (33, 60), (37, 63), (44, 50)], lapel)
    # shirt V
    poly(img, [(26, 45), (38, 45), (32, 59)], C["white"])
    poly(img, [(26, 45), (31, 48), (28, 50)], C["hull_lt"])
    poly(img, [(38, 45), (33, 48), (36, 50)], C["hull_lt"])
    # extra-long red tie, past the bottom of the frame
    rect(img, 31, 47, 33, 49, C["tie"])
    poly(img, [(31, 50), (33, 50), (35, 63), (29, 63)], C["tie"])
    px(img, 31, 47, (236, 70, 80, 255))
    for y in range(52, 63, 3):
        px(img, 32, y, C["maroon"])
    # neck
    rect(img, 26, 40, 38, 46, C["skin_dk"])
    eye_badge(img, 41, 54)
    return img


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
    rect(img, 29, 43, 35, 43, C["rock"])


def eyes(img, mode):
    """mode: 'open' (small squinty eyes), 'blink', 'narrow' (hype: glowing red slits)."""
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
            px(img, cx, 28, C["suit"])
            px(img, cx - 1, 28, C["suit"])
            px(img, cx - 1, 29, C["black"])
            px(img, cx, 29, C["black"])
            rect(img, cx - 2, 27, cx + 1, 27, C["skin_dk"])  # heavy lids
            px(img, cx - 3, 28, C["skin_dk"])
            px(img, cx + 2, 28, C["skin_dk"])
            rect(img, cx - 1, 30, cx + 1, 30, C["skin_dk"])  # puffy bags


def teeth(img, x0, x1, y):
    for x in range(x0, x1 + 1):
        px(img, x, y, C["white"] if (x - x0) % 2 == 0 else C["hull_lt"])


def mouth(img, state):
    if state == 0:  # pursed, the classic pout
        ellipse(img, 28, 37, 36, 41, C["fire_red"])
        rect(img, 30, 39, 34, 39, C["rock_dk"])
        rect(img, 30, 37, 33, 37, (236, 120, 110, 255))
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
    spikes = [(14, 7, 2), (20, 2, 3), (26, 0, 3), (32, 0, 3), (38, 0, 3), (44, 2, 3), (50, 7, 2)]
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
    rect(img, 12, 17, 52, 20, C["deck"])
    rect(img, 12, 17, 52, 17, hl)
    rect(img, 12, 20, 52, 20, dk)
    for x in range(15, 51, 5):
        px(img, x, 18, C["gold"])
        px(img, x, 19, C["gold_dk"])
    # nose-guard point with a red gem
    poly(img, [(30, 20), (34, 20), (32, 23)], C["deck"])
    px(img, 32, 21, C["fire_red"])
    px(img, 31, 20, C["fire_orange"])


def figure(state, eye_mode="open"):
    img = body()
    face(img)
    hair(img)
    helmet(img)
    eyes(img, eye_mode)
    mouth(img, state)
    return outline(img)


def red_glow(bg, fig):
    """Hype: a red/orange aura hugging the silhouette."""
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
        fig = figure(3, "narrow")
        bg = red_glow(bg, fig)
    else:
        fig = figure(i)
    paste(bg, fig, 0, 0)
    return bg


def build():
    return strip([frame(i) for i in range(FRAMES)])
