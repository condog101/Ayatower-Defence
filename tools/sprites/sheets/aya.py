"""The Ayatower / Grey Turban: popup portrait for the player's hero.

FICTIONAL SATIRICAL CARICATURE. The Grey Turban is an invented cartoon wizard for a parody game
(Gandalf crossed with an elderly cleric caricature); nothing here depicts or describes real
events or statements.

Big rounded grey-black turban with wrapped folds, bushy white eyebrows, round spectacles, a long
flowing white beard, grey robe, and a wooden staff with a glowing white tip on the right.
Background: dusk over the Strait (purple-to-orange sky, low sun, sea strip, distant minaret).
Frames: 0 rest (mouth hidden in the beard), 1 talk, 2 talk wider, 3 blink, 4 hype (staff raised,
tip flashing white, stern wide eyes).
"""
import math

from draw import circle, disc, ellipse, new, outline, paste, poly, px, rect, strip
from palette import C

NAME = "aya"
FRAME = (64, 64)
FRAMES = 5

CLEAR = (0, 0, 0, 0)


def background():
    img = new(64, 64, C["suit"])
    # dusk gradient: navy -> purple -> maroon -> orange -> gold at the horizon (y = 46)
    stops = [(0, C["suit"]), (10, C["dusk"]), (24, C["maroon"]), (34, C["fire_red"]), (40, C["fire_orange"]),
             (45, C["fire_yellow"])]
    for y in range(46):
        for i in range(len(stops) - 1):
            y0, c0 = stops[i]
            y1, c1 = stops[i + 1]
            if y0 <= y < y1:
                t = (y - y0) / (y1 - y0)
                for x in range(64):
                    # ordered 2x2 dither between the two stops
                    thr = (0, 2, 3, 1)[(y % 2) * 2 + (x % 2)] / 4 + 0.125
                    px(img, x, y, c1 if t > thr else c0)
    # a few early stars
    for x, y in ((6, 3), (17, 6), (58, 4), (47, 9), (3, 12)):
        px(img, x, y, C["cream"])
    # low sun on the horizon, left of centre
    disc(img, 13, 46, 6, C["fire_yellow"])
    disc(img, 13, 46, 4, C["cream"])
    # distant shore with a minaret and dome silhouette
    sil = C["maroon"]
    rect(img, 0, 43, 26, 45, sil)
    rect(img, 4, 30, 5, 44, sil)  # minaret
    rect(img, 3, 33, 6, 33, sil)
    px(img, 4, 29, sil)
    px(img, 4, 28, C["gold_dk"])
    ellipse(img, 8, 38, 14, 44, sil)  # dome
    px(img, 11, 37, sil)
    rect(img, 16, 41, 22, 44, sil)
    # sea strip with the sun's reflection
    rect(img, 0, 46, 63, 63, C["water_dk"])
    for y in range(46, 64):
        for x in range(64):
            if (x * 3 + y * 7) % 13 == 0:
                px(img, x, y, C["water"])
    for k, y in enumerate(range(47, 63, 2)):
        w = 5 - k // 2
        for x in range(13 - w, 14 + w):
            if (x + k) % 3:
                px(img, x, y, C["fire_orange"] if k > 2 else C["fire_yellow"])
    rect(img, 0, 46, 63, 46, C["fire_orange"])
    # frame edge
    rect(img, 0, 0, 63, 0, C["gold_dk"])
    rect(img, 0, 0, 0, 63, C["gold_dk"])
    rect(img, 0, 63, 63, 63, C["black"])
    rect(img, 63, 0, 63, 63, C["black"])
    return img


def robe(img):
    grey, lt, dk = C["smoke"], C["smoke_lt"], C["iron"]
    poly(img, [(2, 63), (5, 52), (12, 46), (22, 43), (42, 43), (52, 46), (59, 52), (62, 63)], grey)
    # inner dark tunic edges either side of the beard
    poly(img, [(20, 44), (26, 63), (16, 63)], dk)
    poly(img, [(44, 44), (38, 63), (48, 63)], dk)
    # folds
    for x0 in (9, 14):
        for y in range(50, 64):
            px(img, x0 + (y - 50) // 5, y, dk)
    for x0 in (52, 56):
        for y in range(50, 64):
            px(img, x0 - (y - 50) // 5, y, dk)
    # lit left shoulder
    for x, y in ((5, 52), (6, 51), (7, 50), (8, 49), (9, 48), (10, 47), (11, 47), (12, 46), (13, 46)):
        px(img, x, y, lt)
        px(img, x, y + 1, lt)


def face(img):
    sk, lt, dk = C["skin"], C["skin_lt"], C["skin_dk"]
    # ears
    ellipse(img, 18, 22, 22, 30, dk)
    ellipse(img, 42, 22, 46, 30, dk)
    px(img, 20, 25, sk)
    px(img, 44, 25, sk)
    # long elderly face
    ellipse(img, 20, 14, 44, 40, lt)
    rect(img, 21, 18, 43, 32, lt)
    for y in range(20, 36):  # shaded right cheek
        px(img, 42, y, sk)
        px(img, 43, y, sk)
    # nose: long and prominent
    rect(img, 31, 24, 33, 31, lt)
    rect(img, 33, 25, 34, 31, sk)
    px(img, 30, 31, dk)
    px(img, 31, 32, dk)
    px(img, 34, 32, dk)
    px(img, 32, 32, sk)
    # wrinkles
    for x in range(24, 29):
        px(img, x, 30 + (1 if x > 26 else 0), sk)
    for x in range(36, 41):
        px(img, x, 31 - (1 if x > 38 else 0), sk)


def eyes(img, mode):
    """mode: 'open', 'blink', 'stern' (hype)."""
    for cx in (27, 37):
        if mode == "blink":
            rect(img, cx - 2, 26, cx + 1, 26, C["skin_dk"])
            px(img, cx - 2, 25, C["skin_dk"])
        else:
            rect(img, cx - 2, 25, cx + 1, 26, C["white"])
            px(img, cx - 1, 25, C["black"])
            px(img, cx, 25, C["black"])
            px(img, cx - 1, 26, C["suit"])
            px(img, cx, 26, C["suit"])
            if mode == "stern":
                rect(img, cx - 2, 27, cx + 1, 27, C["white"])
                px(img, cx - 1, 27, C["suit"])
                px(img, cx, 27, C["suit"])
            else:
                rect(img, cx - 2, 24, cx + 1, 24, C["skin_dk"])  # hooded lids
        # round spectacles
        circle(img, cx - 0.5, 25.5, 3.6, C["iron"], thickness=0.9)
        if mode != "blink":
            px(img, cx - 3, 23, C["white"])  # lens glint
    rect(img, 31, 25, 32, 25, C["iron"])  # bridge
    # bushy white eyebrows
    for side, cx in ((-1, 27), (1, 37)):
        for i in range(-4, 5):
            x = cx + i
            if mode == "stern":
                y = 21 + (i * side + 4) // 3  # angled down toward the nose
            else:
                y = 21 - (1 if abs(i) < 3 else 0)
            px(img, x, y, C["white"])
            px(img, x, y + 1, C["chrome"] if (x % 2) else C["white"])
            if abs(i) == 4 or (x % 3 == 0):
                px(img, x + side, y - 1, C["white"])  # tufts


def beard(img, mouth):
    wt, lt, md = C["white"], C["chrome"], C["smoke_lt"]
    # moustache sweeping out over the cheeks
    poly(img, [(23, 33), (28, 31), (32, 32), (36, 31), (41, 33), (40, 36), (32, 35), (24, 36)], wt)
    # long flowing beard down past the frame
    poly(img, [(21, 32), (24, 36), (32, 37), (40, 36), (43, 32), (46, 44), (45, 56), (41, 63), (23, 63),
               (19, 56), (18, 44)], wt)
    # mouth inside the beard
    if mouth == 1:
        ellipse(img, 29, 35, 35, 38, C["black"])
        rect(img, 30, 36, 34, 36, C["maroon"])
    elif mouth == 2:
        ellipse(img, 28, 34, 36, 40, C["black"])
        rect(img, 30, 38, 34, 39, C["maroon"])
        rect(img, 30, 35, 34, 35, C["cream"])  # teeth
    # flowing strands
    for i, x0 in enumerate(range(22, 45, 4)):
        for y in range(38 + (i % 2) * 3, 63):
            x = x0 + round(math.sin((y + i * 5) / 5.0) * 1.0)
            if img.getpixel((x, y)) == wt:
                px(img, x, y, lt if y < 52 else md)
    for x, y in ((20, 44), (19, 50), (20, 56), (45, 46), (44, 52)):
        px(img, x, y, md)
    # moustache parting + shading
    px(img, 32, 33, lt)
    for x in range(34, 41):
        px(img, x, 35, lt)


def turban(img):
    """Big rounded grey-black turban: cloth bands wrapping around the dome in curved folds
    that cross over at the front, lit from the top-left."""
    base, lt, hl, dk = C["iron"], C["smoke"], C["smoke_lt"], C["black"]
    ellipse(img, 13, 1, 51, 24, base)
    rect(img, 15, 14, 49, 21, base)
    cx = 32.0
    # wrapped folds: arcs bowing downward around the dome; left-to-right bands and right-to-left
    # bands alternate so the cloth reads as wound round and round
    for k, (y0, tilt) in enumerate(((5, 0.12), (9, -0.10), (13, 0.10), (17, -0.08))):
        for x in range(14, 51):
            u = (x - cx) / 19.0
            y = round(y0 + 3.2 * u * u + tilt * (x - cx))
            if not img.getpixel((x, y))[3]:
                continue
            px(img, x, y, hl if x < 28 else lt)  # lit top edge of the fold
            if img.getpixel((x, y + 1))[3]:
                px(img, x, y + 1, lt if x < 26 else base)
            if img.getpixel((x, y - 1)) == base and x > 30:
                px(img, x, y - 1, dk)  # crease shadow above
    # front tuck where the cloth crosses over the brow
    poly(img, [(27, 15), (37, 15), (35, 21), (29, 21)], lt)
    rect(img, 28, 15, 36, 15, hl)
    rect(img, 29, 18, 35, 18, base)
    rect(img, 15, 21, 49, 22, base)  # lower wrap on the forehead
    rect(img, 15, 21, 30, 21, lt)
    rect(img, 15, 22, 49, 22, dk)
    # dark shaded right side
    for y in range(3, 22):
        for x in range(43, 52):
            if img.getpixel((x, y)) == base and (x + y) % 2 == 0:
                px(img, x, y, dk)
    px(img, 21, 4, C["white"])  # sheen
    px(img, 22, 4, hl)
    px(img, 20, 5, hl)


def staff(img, raised):
    top = 2 if raised else 8
    x = 53
    rect(img, x, top + 2, x + 1, 63, C["wood"])
    rect(img, x + 1, top + 2, x + 1, 63, C["rock"])
    for y in range(top + 8, 63, 7):  # knots
        px(img, x, y, C["rock_lt"])
        px(img, x + 1, y + 1, C["rock_dk"])
    # gnarled crook cradling the glowing stone
    px(img, x - 1, top + 1, C["wood"])
    px(img, x - 1, top, C["wood"])
    px(img, x + 2, top + 1, C["rock"])
    px(img, x + 2, top, C["rock"])
    # hand gripping the staff with a grey sleeve
    hy = top + 32
    poly(img, [(44, 63), (47, hy + 4), (51, hy + 2), (52, hy + 6), (52, 63)], C["smoke"])
    rect(img, 51, hy, 56, hy + 4, C["skin_lt"])
    rect(img, 51, hy + 4, 56, hy + 4, C["skin"])
    for y in (hy + 1, hy + 3):
        px(img, 55, y, C["skin"])


def glow(img, raised):
    """Glowing staff tip (drawn after the outline so the light spills over it)."""
    cx, cy = 53.5, (1.5 if raised else 7.5)
    r = 4.5 if raised else 2.8
    for y in range(0, 20):
        for x in range(40, 64):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d <= r * 0.45:
                px(img, x, y, C["white"])
            elif d <= r * 0.8:
                px(img, x, y, C["foam"])
            elif d <= r and (x + y) % 2 == 0:
                px(img, x, y, C["shallow"])
    if raised:  # rays
        for k in range(8):
            ang = k * math.pi / 4 + math.pi / 8
            for t in range(6, 10):
                x, y = round(cx + math.cos(ang) * t - 0.5), round(cy + math.sin(ang) * t - 0.5)
                px(img, x, y, C["white"] if t < 8 else C["fire_yellow"])


def figure(mouth, eye_mode="open", raised=False):
    img = new(64, 64)
    robe(img)
    staff(img, raised)
    face(img)
    beard(img, mouth)
    turban(img)
    eyes(img, eye_mode)  # bushy brows overlap the turban's lower wrap
    return outline(img)


def frame(i):
    bg = background()
    if i == 3:
        fig = figure(0, "blink")
    elif i == 4:
        fig = figure(1, "stern", raised=True)
    else:
        fig = figure(i)
    paste(bg, fig, 0, 0)
    glow(bg, raised=(i == 4))
    return bg


def build():
    return strip([frame(i) for i in range(FRAMES)])
