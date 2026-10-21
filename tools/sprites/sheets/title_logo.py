"""Title plate: AYATOWER / DEFENCE in Press Start 2P on a dark stone plate with a gold frame,
and a red/black stripe reading YOU SHAH-LL NOT PASS!"""
from draw import font_text, font_text_width, new, px, rect, rng
from palette import C

NAME = "title_logo"
FRAME = (288, 96)
FRAMES = 1

W, H = FRAME
BG = (22, 18, 26, 255)


def stone_frame(img):
    """3px carved-stone border with a gold inner rule; light from the top-left."""
    rect(img, 0, 0, W - 1, H - 1, C["rock_dk"])
    rect(img, 0, 0, W - 1, 1, C["sand_dk"])
    rect(img, 0, 0, 1, H - 1, C["sand_dk"])
    rect(img, 2, 2, W - 3, H - 3, C["rock"])
    rnd = rng(7)
    for x in range(W):
        for y in (0, 1, H - 2, H - 1):
            if rnd.random() < 0.18:
                px(img, x, y, C["rock_lt"])
    # block joints in the stone border
    for x in range(10, W, 18):
        px(img, x, 0, C["rock_dk"])
        px(img, x, 1, C["rock_dk"])
        px(img, x, H - 1, C["black"])
        px(img, x, H - 2, C["black"])
    rect(img, 3, 3, W - 4, H - 4, C["gold_dk"])
    rect(img, 3, 3, W - 4, 3, C["gold"])
    rect(img, 3, 3, 3, H - 4, C["gold"])
    rect(img, 4, 4, W - 5, H - 5, BG)
    for x, y in ((3, 3), (W - 4, 3), (3, H - 4), (W - 4, H - 4)):
        px(img, x, y, C["cream"])


def star8(img, cx, cy, c, hi):
    """Tiny eight-point Persian star."""
    for dx, dy in ((0, -2), (0, 2), (-2, 0), (2, 0), (-1, -1), (1, -1), (-1, 1), (1, 1)):
        px(img, cx + dx, cy + dy, c)
    for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
        px(img, cx + dx, cy + dy, c)
    px(img, cx, cy, hi)


def build():
    img = new(W, H, BG)
    stone_frame(img)
    # faint ember speckle rising from the bottom (Mordor glow)
    rnd = rng(1979)
    for _ in range(220):
        x, y = rnd.randint(5, W - 6), rnd.randint(5, H - 6)
        if rnd.random() < (y / H) ** 2:
            px(img, x, y, C["maroon"] if rnd.random() < 0.75 else C["fire_red"])
    # AYATOWER: gold with a red drop shadow and a cream top highlight
    big = "AYATOWER"
    bw = font_text_width(big, 32)
    bx, by = (W - bw) // 2, 8
    font_text(img, bx + 3, by + 3, big, 32, C["maroon"])
    font_text(img, bx + 2, by + 2, big, 32, C["tie"])
    font_text(img, bx, by, big, 32, C["gold"])
    for x in range(bx, bx + bw):
        for y in range(by, by + 4):
            if img.getpixel((x, y)) == C["gold"]:
                px(img, x, y, C["cream"] if y == by else C["fire_yellow"])
                break
    # dark-gold lower half of the letters for a metallic band
    for x in range(bx, bx + bw):
        for y in range(by + 20, by + 28):
            if img.getpixel((x, y)) == C["gold"]:
                px(img, x, y, C["gold_dk"] if y >= by + 24 else C["gold"])
    # DEFENCE in cream, flanked by gold rules and Persian stars
    mid = "DEFENCE"
    mw = font_text_width(mid, 16)
    mx, my = (W - mw) // 2, 45
    font_text(img, mx + 1, my + 1, mid, 16, C["black"])
    font_text(img, mx, my, mid, 16, C["cream"])
    for x0, x1 in ((14, mx - 14), (mx + mw + 12, W - 15)):
        rect(img, x0, my + 6, x1, my + 6, C["gold"])
        rect(img, x0, my + 7, x1, my + 7, C["gold_dk"])
    star8(img, mx - 8, my + 6, C["gold"], C["cream"])
    star8(img, mx + mw + 6, my + 6, C["gold"], C["cream"])
    star8(img, 9, my + 6, C["gold_dk"], C["gold"])
    star8(img, W - 10, my + 6, C["gold_dk"], C["gold"])
    # red/black hazard stripe with the tagline
    sy0, sy1 = 68, 86
    rect(img, 4, sy0 - 1, W - 5, sy0 - 1, C["gold"])
    rect(img, 4, sy0, W - 5, sy1, C["tie"])
    rect(img, 4, sy0 + 10, W - 5, sy1, C["maroon"])
    for k in range(0, W, 12):
        for y in range(sy0, sy1 + 1):
            for d in range(4):
                x = k + d + (sy1 - y) // 2
                if 4 <= x <= W - 5:
                    px(img, x, y, C["black"])
    rect(img, 4, sy1 + 1, W - 5, sy1 + 1, C["gold"])
    tag = "YOU SHAH-LL NOT PASS!"
    tw = font_text_width(tag, 8)
    tx = (W - tw) // 2
    rect(img, tx - 6, sy0 + 1, tx + tw + 5, sy1 - 1, C["black"])
    rect(img, tx - 6, sy0 + 1, tx + tw + 5, sy0 + 1, C["iron"])
    font_text(img, tx, sy0 + 5, tag, 8, C["cream"])
    return img
