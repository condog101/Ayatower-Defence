"""The Ayatower / Grey Turban: popup portrait for the player's hero.

FICTIONAL SATIRICAL CARICATURE. The Grey Turban is an invented cartoon wizard for a parody game
(Gandalf crossed with an elderly cleric caricature); nothing here depicts or describes real
events or statements.

Big rounded grey-black turban with wrapped folds, bushy white eyebrows, round spectacles, a long
flowing white beard, a grey wizard's cloak with a high collar and mithril clasps, a sealed scroll
in the left hand, and a gnarled staff cradling a glowing crystal on the right.
Background: a starlit night over misty peaks, a crescent moon, and the white Ayatower with its
dome and burning beacon in the distance.
Frames: 0 rest (mouth hidden in the beard), 1 talk, 2 talk wider, 3 blink, 4 wizardry (staff
raised, crystal blazing, stern wide eyes, sparks).
"""
import math

from draw import circle, disc, ellipse, new, outline, paste, poly, px, rect, rng, strip
from palette import C

NAME = "aya"
FRAME = (64, 64)
FRAMES = 5

CLEAR = (0, 0, 0, 0)


def background():
    img = new(64, 64, C["night"])
    # night gradient: deep night overhead -> wizardly dusk near the peaks (ordered dither)
    stops = [(0, C["night"]), (22, C["night"]), (40, C["dusk"]), (48, C["dusk"])]
    for y in range(48):
        for i in range(len(stops) - 1):
            y0, c0 = stops[i]
            y1, c1 = stops[i + 1]
            if y0 <= y < y1:
                t = (y - y0) / max(1, (y1 - y0))
                for x in range(64):
                    thr = (0, 2, 3, 1)[(y % 2) * 2 + (x % 2)] / 4 + 0.125
                    px(img, x, y, c1 if t > thr else c0)
    # stars: a few bright twinkles and many faint points
    rnd = rng(11)
    for _ in range(46):
        x, y = rnd.randint(1, 62), rnd.randint(1, 40)
        px(img, x, y, C["mithril"] if rnd.random() < 0.55 else C["smoke"])
    for x, y in ((11, 15), (58, 9), (47, 3), (24, 2), (60, 30), (37, 6)):
        px(img, x, y, C["white"])
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            px(img, x + dx, y + dy, C["mithril_lt"])
    # crescent moon, upper left
    disc(img, 6, 8, 3.8, C["cream"])
    disc(img, 8, 6.8, 3.2, C["night"])
    px(img, 3, 9, C["white"])
    px(img, 3, 8, C["white"])
    # misty peaks with snow caps
    poly(img, [(0, 46), (8, 38), (14, 41), (24, 33), (31, 38), (38, 31), (47, 39), (54, 35), (64, 43), (64, 50), (0, 50)],
         C["stone_dk"])
    for x0, y0 in ((24, 33), (38, 31), (54, 35)):
        for k in range(3):
            for x in range(x0 - k, x0 + k + 1):
                px(img, x, y0 + k, C["smoke_lt"] if (x + k) % 3 else C["white"])
    # the Ayatower in the distance, left: tiered white tower with a dome and a beacon fire
    tw = C["smoke_lt"]
    rect(img, 1, 38, 14, 48, tw)
    rect(img, 3, 32, 12, 38, tw)
    rect(img, 6, 22, 9, 32, tw)
    rect(img, 6, 22, 6, 32, C["chrome"])
    rect(img, 3, 32, 3, 37, C["chrome"])
    rect(img, 1, 38, 1, 47, C["chrome"])
    for x in range(1, 15, 2):
        px(img, x, 37, tw)
    for x in range(3, 13, 2):
        px(img, x, 31, tw)
    disc(img, 11.5, 29.5, 1.8, C["shallow"])  # little dome
    px(img, 11, 27, C["gold"])
    px(img, 7, 26, C["night"])
    px(img, 7, 35, C["fire_yellow"])  # lit windows
    px(img, 10, 42, C["fire_yellow"])
    px(img, 4, 42, C["fire_yellow"])
    for x, y, c in ((7, 21, "iron"), (8, 21, "iron"), (7, 20, "fire_yellow"), (8, 20, "fire_orange"),
                    (7, 19, "fire_orange"), (8, 18, "fire_red"), (6, 20, "fire_red"), (9, 20, "fire_red")):
        px(img, x, y, C[c])
    # low mist bank
    for x in range(64):
        for y in range(46, 64):
            if (x + y) % 2 == 0 and y < 50:
                px(img, x, y, C["smoke"])
            elif y >= 50:
                px(img, x, y, C["stone_dk"] if (x * 3 + y) % 7 else C["smoke"])
    # frame edge
    rect(img, 0, 0, 63, 0, C["gold_dk"])
    rect(img, 0, 0, 0, 63, C["gold_dk"])
    rect(img, 0, 63, 63, 63, C["black"])
    rect(img, 63, 0, 63, 63, C["black"])
    return img


def robe(img):
    """Grey wizard's cloak: high collar behind the head, mithril clasps, star-stitched hem."""
    grey, lt, dk = C["smoke"], C["smoke_lt"], C["iron"]
    # high upturned collar behind the head
    poly(img, [(12, 46), (14, 30), (20, 36), (44, 36), (50, 30), (52, 46)], dk)
    poly(img, [(13, 44), (15, 32), (19, 37), (18, 44)], grey)
    poly(img, [(51, 44), (49, 32), (45, 37), (46, 44)], C["black"])
    poly(img, [(2, 63), (5, 52), (12, 46), (22, 43), (42, 43), (52, 46), (59, 52), (62, 63)], grey)
    poly(img, [(20, 44), (26, 63), (16, 63)], dk)
    poly(img, [(44, 44), (38, 63), (48, 63)], dk)
    for x0 in (9, 14):
        for y in range(50, 64):
            px(img, x0 + (y - 50) // 5, y, dk)
    for x0 in (52, 56):
        for y in range(50, 64):
            px(img, x0 - (y - 50) // 5, y, dk)
    for x, y in ((5, 52), (6, 51), (7, 50), (8, 49), (9, 48), (10, 47), (11, 47), (12, 46), (13, 46)):
        px(img, x, y, lt)
        px(img, x, y + 1, lt)
    # mithril clasps with a fine chain across the chest
    for cx in (19, 45):
        disc(img, cx, 46, 1.8, C["mithril"])
        px(img, cx - 1, 45, C["mithril_lt"])
        px(img, cx, 46, C["white"])
    for x in range(21, 44, 2):
        px(img, x, 47 + (1 if 26 < x < 38 else 0), C["chrome"])
    # stitched stars on the cloak
    for x, y in ((8, 58), (12, 54), (55, 57), (51, 61), (6, 62)):
        px(img, x, y, C["mithril_lt"])


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
    """mode: 'open', 'blink', 'stern' (wizardry)."""
    for cx in (27, 37):
        if mode == "blink":
            rect(img, cx - 2, 26, cx + 1, 26, C["skin_dk"])
            px(img, cx - 2, 25, C["skin_dk"])
        else:
            rect(img, cx - 2, 25, cx + 1, 26, C["white"])
            px(img, cx - 1, 25, C["black"])
            px(img, cx, 25, C["black"])
            px(img, cx - 1, 26, C["night"])
            px(img, cx, 26, C["night"])
            if mode == "stern":
                rect(img, cx - 2, 27, cx + 1, 27, C["white"])
                px(img, cx - 1, 27, C["night"])
                px(img, cx, 27, C["night"])
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
    top = 2 if raised else 9
    x = 53
    rect(img, x, top + 4, x + 1, 63, C["wood"])
    rect(img, x + 1, top + 4, x + 1, 63, C["wood_dk"])
    for y in range(top + 10, 63, 7):  # knots
        px(img, x, y, C["parch_dk"])
        px(img, x + 1, y + 1, C["black"])
    # gnarled claws cradling the crystal
    for dx, dy in ((-2, 3), (-2, 2), (-2, 1), (3, 3), (3, 2), (3, 1), (-1, 4), (2, 4)):
        px(img, x + dx, top + dy, C["wood"] if dx < 0 else C["wood_dk"])
    # the crystal: a tall faceted diamond
    poly(img, [(x + 0.5, top - 2), (x + 2.5, top + 1.5), (x + 0.5, top + 4), (x - 1.5, top + 1.5)], C["mithril"])
    px(img, x, top, C["mithril_lt"])
    px(img, x, top - 1, C["white"])
    px(img, x - 1, top + 1, C["mithril_lt"])
    px(img, x + 1, top + 2, C["night"])
    # hand gripping the staff with a grey sleeve
    hy = top + 32
    poly(img, [(44, 63), (47, hy + 4), (51, hy + 2), (52, hy + 6), (52, 63)], C["smoke"])
    rect(img, 51, hy, 56, hy + 4, C["skin_lt"])
    rect(img, 51, hy + 4, 56, hy + 4, C["skin"])
    for y in (hy + 1, hy + 3):
        px(img, 55, y, C["skin"])


def scroll(img):
    """Sealed scroll held in the left hand at the bottom-left of the portrait."""
    # sleeve
    poly(img, [(14, 63), (12, 57), (17, 54), (22, 58), (22, 63)], C["iron"])
    # scroll body, slanted slightly, with rolled ends
    for k in range(13):
        x = 3 + k
        y = 52 - k // 4
        rect(img, x, y, x, y + 4, C["cream"])
        px(img, x, y, C["white"])
        px(img, x, y + 4, C["parch"])
    for x0, y0 in ((2, 52), (16, 49)):
        rect(img, x0, y0 - 1, x0 + 1, y0 + 5, C["parch"])
        px(img, x0, y0 - 1, C["cream"])
        rect(img, x0 + 1, y0, x0 + 1, y0 + 5, C["parch_dk"])
    for k in range(3, 12, 2):  # lines of script showing through
        px(img, 3 + k, 53 - k // 4, C["smoke"])
    # red wax seal on a ribbon
    rect(img, 9, 55, 9, 59, C["tie"])
    disc(img, 9.5, 59.5, 1.7, C["tie"])
    px(img, 9, 59, C["fire_orange"])
    px(img, 10, 60, C["maroon"])
    # hand wrapped around the scroll
    rect(img, 11, 52, 15, 56, C["skin_lt"])
    rect(img, 11, 56, 15, 56, C["skin"])
    for x in (12, 14):
        px(img, x, 53, C["skin"])


def glow(img, raised):
    """Crystal light (drawn after the outline so the light spills over it)."""
    cx, cy = 53.5, (2.5 if raised else 9.5)
    r = 5.0 if raised else 2.6
    for y in range(0, 22):
        for x in range(40, 64):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d <= r * 0.35:
                px(img, x, y, C["white"])
            elif d <= r * 0.7:
                px(img, x, y, C["mithril_lt"])
            elif d <= r and (x + y) % 2 == 0:
                px(img, x, y, C["mithril"])
    if raised:  # rays and sparks of wizardry
        for k in range(8):
            ang = k * math.pi / 4 + math.pi / 8
            for t in range(6, 11):
                x, y = round(cx + math.cos(ang) * t - 0.5), round(cy + math.sin(ang) * t - 0.5)
                px(img, x, y, C["white"] if t < 8 else C["mithril_lt"])
        for x, y in ((40, 6), (44, 16), (36, 12), (60, 22), (47, 24), (34, 4)):
            px(img, x, y, C["mithril_lt"])
            px(img, x + 1, y, C["dusk"])


def figure(mouth, eye_mode="open", raised=False):
    img = new(64, 64)
    robe(img)
    staff(img, raised)
    scroll(img)
    face(img)
    beard(img, mouth)
    turban(img)
    eyes(img, eye_mode)  # bushy brows overlap the turban's lower wrap
    return outline(img)


def aura(bg, fig):
    """Wizardry: a mithril-blue halo hugging the silhouette, purple at its edge."""
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
                px(out, x, y, C["mithril_lt"])
            elif near == 2:
                px(out, x, y, C["mithril"])
            elif near == 3 and (x + y) % 2 == 0:
                px(out, x, y, C["dusk"])
    return out


def frame(i):
    bg = background()
    if i == 3:
        fig = figure(0, "blink")
    elif i == 4:
        fig = figure(1, "stern", raised=True)
        bg = aura(bg, fig)
    else:
        fig = figure(i)
    paste(bg, fig, 0, 0)
    glow(bg, raised=(i == 4))
    return bg


def build():
    return strip([frame(i) for i in range(FRAMES)])
