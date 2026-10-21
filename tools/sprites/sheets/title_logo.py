"""Title plate: a carved slate tablet ringed by a band of fiery inscription (invented
squiggle-glyphs in the manner of an elvish ring verse; no real script), a red gem set into the top
of the ring, AYATOWER in gold, DEFENCE in cream, and YOU SHAH-LL NOT PASS! on a parchment
ribbon with folded tails."""
from draw import disc, font_text, font_text_width, new, poly, px, rect, rng
from palette import C

NAME = "title_logo"
FRAME = (288, 96)
FRAMES = 1

W, H = FRAME
O0, O1 = 3, 12  # inscription band: outer rule at 3, inner rule at 12 (from each edge)


def plate(img):
    """Slate slab with a bevelled edge (light from the top-left) and stone speckle."""
    rnd = rng(7)
    rect(img, 0, 0, W - 1, H - 1, C["stone"])
    for _ in range(900):
        x, y = rnd.randint(1, W - 2), rnd.randint(1, H - 2)
        px(img, x, y, C["stone_lt"] if rnd.random() < 0.45 else C["stone_dk"])
    rect(img, 0, 0, W - 1, 0, C["black"])
    rect(img, 0, H - 1, W - 1, H - 1, C["black"])
    rect(img, 0, 0, 0, H - 1, C["black"])
    rect(img, W - 1, 0, W - 1, H - 1, C["black"])
    rect(img, 1, 1, W - 2, 1, C["stone_lt"])
    rect(img, 1, 1, 1, H - 2, C["stone_lt"])
    rect(img, 1, H - 2, W - 2, H - 2, C["stone_dk"])
    rect(img, W - 2, 1, W - 2, H - 2, C["stone_dk"])


def glyph_strip(length, seed):
    """A strip `length` x 8 of invented flowing glyphs: stems with bowls, hooks and accents."""
    img = new(length, 8)
    rnd = rng(seed)
    x = 1
    hi, mid = C["fire_yellow"], C["fire_orange"]
    while x < length - 4:
        kind = rnd.random()
        up = rnd.random() < 0.3
        down = not up and rnd.random() < 0.3
        # stem
        y0, y1 = (1 if up else 3), (6 if down else 5)
        for y in range(y0, y1 + 1):
            px(img, x, y, mid)
        px(img, x, y0, hi)
        w = 1
        if kind < 0.45:  # one bowl to the right
            for dx, dy in ((1, 3), (2, 4), (1, 5)):
                px(img, x + dx, dy, mid)
            w = 3
        elif kind < 0.7:  # two bowls
            for dx, dy in ((1, 3), (2, 4), (1, 5), (3, 3), (4, 4), (3, 5)):
                px(img, x + dx, dy, mid)
            px(img, x + 2, 3, mid)
            w = 5
        elif kind < 0.85:  # hook over the top
            for dx, dy in ((1, 2), (2, 2), (3, 3), (3, 4)):
                px(img, x + dx, dy, mid)
            w = 4
        else:  # curl under
            for dx, dy in ((1, 5), (2, 5), (2, 4)):
                px(img, x + dx, dy, mid)
            w = 3
        # accent marks (dots / little tildes) above the letter
        r = rnd.random()
        if r < 0.3:
            px(img, x + w // 2 + 1, 1, hi)
        elif r < 0.45:
            px(img, x + 1, 1, hi)
            px(img, x + 2, 0, hi)
            px(img, x + 3, 1, hi)
        x += w + 2
        if rnd.random() < 0.18:
            x += 3  # word gap
    return img


def inscription_band(img):
    rect(img, O0, O0, W - 1 - O0, H - 1 - O0, C["black"])
    for k, c in ((O0, C["gold"]), (O1, C["gold_dk"])):
        rect(img, k, k, W - 1 - k, k, c)
        rect(img, k, H - 1 - k, W - 1 - k, H - 1 - k, c if k == O1 else C["gold_dk"])
        rect(img, k, k, k, H - 1 - k, c)
        rect(img, W - 1 - k, k, W - 1 - k, H - 1 - k, c if k == O1 else C["gold_dk"])
    # faint red glow inside the band
    for x in range(O0 + 1, W - 1 - O0):
        for y in list(range(O0 + 1, O1)) + list(range(H - O1, H - 1 - O0)):
            if (x + y) % 2 == 0:
                px(img, x, y, C["maroon"])
    for y in range(O1, H - O1):
        for x in list(range(O0 + 1, O1)) + list(range(W - O1, W - 1 - O0)):
            if (x + y) % 2 == 0:
                px(img, x, y, C["maroon"])
    n = W - 2 * O1 - 4
    top = glyph_strip(n, 11)
    bot = glyph_strip(n, 23)
    img.alpha_composite(top, (O1 + 2, O0 + 1))
    img.alpha_composite(bot, (O1 + 2, H - O1))
    m = H - 2 * O1 - 4
    left = glyph_strip(m, 37).rotate(90, expand=True)
    right = glyph_strip(m, 41).rotate(-90, expand=True)
    img.alpha_composite(left, (O0 + 1, O1 + 2))
    img.alpha_composite(right, (W - O1, O1 + 2))
    # corner studs: little gold eight-point stars
    for cx in (O0 + 4.5, W - 1 - O0 - 4.5):
        for cy in (O0 + 4.5, H - 1 - O0 - 4.5):
            x, y = int(cx), int(cy)
            rect(img, x - 3, y - 3, x + 4, y + 4, C["black"])
            star8(img, x, y, C["gold"], C["cream"])


def star8(img, cx, cy, c, hi):
    """Eight-point Persian star."""
    for dx, dy in ((0, -3), (0, 3), (-3, 0), (3, 0), (-2, -2), (2, -2), (-2, 2), (2, 2)):
        px(img, cx + dx, cy + dy, c)
    rect(img, cx - 1, cy - 1, cx + 1, cy + 1, c)
    for dx, dy in ((0, -2), (0, 2), (-2, 0), (2, 0)):
        px(img, cx + dx, cy + dy, c)
    px(img, cx, cy, hi)
    px(img, cx + 1, cy + 1, C["gold_dk"])


def field(img):
    """The recessed tablet inside the ring: darker slate, shadowed along the top and left."""
    rnd = rng(19)
    x0, y0, x1, y1 = O1 + 1, O1 + 1, W - 2 - O1, H - 2 - O1
    rect(img, x0, y0, x1, y1, C["stone_dk"])
    for _ in range(500):
        x, y = rnd.randint(x0, x1), rnd.randint(y0, y1)
        px(img, x, y, C["iron"] if rnd.random() < 0.6 else C["stone"])
    rect(img, x0, y0, x1, y0, C["black"])
    rect(img, x0, y0, x0, y1, C["black"])
    rect(img, x0 + 1, y0 + 1, x1, y0 + 1, C["iron"])


def gem(img, cx, cy):
    """Faceted red gem in a gold claw setting, breaking the top of the ring."""
    disc(img, cx, cy, 7.0, C["black"])
    disc(img, cx, cy, 6.0, C["gold_dk"])
    disc(img, cx - 0.3, cy - 0.3, 5.2, C["gold"])
    disc(img, cx, cy, 4.2, C["black"])
    disc(img, cx, cy, 3.6, C["tie"])
    # facets
    for dx, dy in ((-2, -1), (-1, -2), (-1, -1), (0, -2)):
        px(img, int(cx) + dx, int(cy) + dy, C["fire_red"])
    for dx, dy in ((1, 1), (2, 1), (1, 2), (0, 2), (2, 0)):
        px(img, int(cx) + dx, int(cy) + dy, C["maroon"])
    px(img, int(cx) - 1, int(cy) - 2, C["white"])
    px(img, int(cx) - 2, int(cy) - 1, C["fire_orange"])
    px(img, int(cx), int(cy), C["fire_red"])
    # claws
    for dx, dy in ((0, -5), (0, 5), (-5, 0), (5, 0)):
        px(img, int(cx) + dx, int(cy) + dy, C["cream"])


def ribbon(img, text, y0, y1):
    """Parchment ribbon with folded, notched tails behind each end."""
    tw = font_text_width(text, 8)
    x0 = (W - tw) // 2 - 12
    x1 = (W + tw) // 2 + 11
    # tails (behind, lower, darker) with V notches
    for side in (-1, 1):
        if side < 0:
            tx0, tx1 = x0 - 20, x0 + 6
        else:
            tx0, tx1 = x1 - 6, x1 + 20
        ty0, ty1 = y0 + 4, y1 + 3
        rect(img, tx0, ty0 - 1, tx1, ty1 + 1, C["black"])
        rect(img, tx0 + 1, ty0, tx1 - 1, ty1, C["parch_dk"])
        rect(img, tx0 + 1, ty0, tx1 - 1, ty0, C["parch"])
        notch_x = tx0 if side < 0 else tx1
        mid = (ty0 + ty1) / 2
        poly(img, [(notch_x, ty0 - 1), (notch_x + side * -5, mid), (notch_x, ty1 + 1)], C["stone_dk"])
        # carve the notch back to the field colour, then re-edge it
        for y in range(ty0 - 1, ty1 + 2):
            k = 5 - abs(y - mid) * 5 / ((ty1 - ty0) / 2 + 1)
            ex = notch_x + side * -int(max(0, k))
            px(img, ex, y, C["black"])
        # fold shadow where the tail tucks behind the main band
        fx = x0 if side < 0 else x1
        poly(img, [(fx, y1 + 1), (fx, ty1 + 1), (fx + side * -6, y1 + 1)], C["wood_dk"])
    # main band
    rect(img, x0 - 1, y0 - 1, x1 + 1, y1 + 1, C["black"])
    rect(img, x0, y0, x1, y1, C["parch"])
    rect(img, x0, y0, x1, y0, C["cream"])
    rect(img, x0, y0 + 1, x1, y0 + 1, C["sand_lt"])
    rect(img, x0, y1, x1, y1, C["parch_dk"])
    # slight curl at the ends
    for x in (x0, x1):
        rect(img, x, y0, x, y1, C["parch_dk"])
    tx = (W - tw) // 2
    ty = (y0 + y1) // 2 - 3
    font_text(img, tx, ty, text, 8, C["maroon"])


def build():
    img = new(W, H, C["stone"])
    plate(img)
    inscription_band(img)
    field(img)
    gem(img, W // 2, O0 + 4)

    # AYATOWER: gold with a black outline, a maroon drop shadow and a bright upper band
    big = "AYATOWER"
    bw = font_text_width(big, 32)
    bx, by = (W - bw) // 2, O1 + 4
    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1), (3, 3), (2, 3), (3, 2)):
        font_text(img, bx + dx, by + dy, big, 32, C["black"])
    font_text(img, bx + 2, by + 2, big, 32, C["maroon"])
    font_text(img, bx, by, big, 32, C["gold"])
    for x in range(bx, bx + bw):
        for y in range(by, by + 32):
            if img.getpixel((x, y)) != C["gold"]:
                continue
            if y < by + 4:
                px(img, x, y, C["fire_yellow"] if y > by else C["cream"])
            elif y >= by + 24:
                px(img, x, y, C["gold_dk"])

    # DEFENCE in cream, flanked by gold rules and Persian stars
    mid = "DEFENCE"
    mw = font_text_width(mid, 16)
    mx, my = (W - mw) // 2, by + 35
    font_text(img, mx + 1, my + 1, mid, 16, C["black"])
    font_text(img, mx, my, mid, 16, C["cream"])
    for x0, x1 in ((O1 + 18, mx - 14), (mx + mw + 12, W - O1 - 19)):
        rect(img, x0, my + 6, x1, my + 6, C["gold"])
        rect(img, x0, my + 7, x1, my + 7, C["gold_dk"])
    star8(img, mx - 8, my + 6, C["gold"], C["cream"])
    star8(img, mx + mw + 7, my + 6, C["gold"], C["cream"])
    star8(img, O1 + 12, my + 6, C["gold_dk"], C["gold"])
    star8(img, W - O1 - 13, my + 6, C["gold_dk"], C["gold"])

    ribbon(img, "YOU SHAH-LL NOT PASS!", my + 19, my + 31)
    return img
