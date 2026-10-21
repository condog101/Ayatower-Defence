"""Tower bases, 16x16 transparent, frame = towerIndex * 3 + tier.

Tier 0 is the basic emplacement, tier 1 adds kit (sandbags, camo nets, more launchers, a flag),
tier 2 is the showpiece (concrete, gold trim, the green-white-red flag). Aimed towers (boats,
aa_gun, missile, sam) keep a mount ring at the exact centre for the turret sheet.

 0 boats    IRGC speedboat pier          6 missile  coastal missile TEL
 1 mines    naval mine-laying barge      7 radar    Ghadir over-the-horizon radar
 2 martyr   explosive drone-boat dock    8 ghadir   midget submarine pen
 3 aa_gun   ZU-23 sandbagged gun pit     9 sam      Bavar-373 SAM site
 4 shahed   Shahed drone launch truck   10 minaret  propaganda minaret
 5 jammer   EW jamming truck
"""
from draw import circle, disc, new, outline, px, rect, strip
from palette import C

NAME = "towers"
FRAME = (16, 16)
FRAMES = 33

CLEAR = (0, 0, 0, 0)
SHADOW = (*C["black"][:3], 80)


def a(c, alpha):
    return (*c[:3], alpha)


# ---------------------------------------------------------------------------
# shared parts

def iran_flag(img, x, y, big=False):
    """Flag on a pole: pole at column x from row y, cloth to the right (green / white / red)."""
    h = 6 if big else 5
    rect(img, x, y, x, y + h, C["iron"])
    w = 4 if big else 3
    rect(img, x + 1, y, x + w, y, C["green"])
    rect(img, x + 1, y + 1, x + w, y + 1, C["white"])
    rect(img, x + 1, y + 2, x + w, y + 2, C["tie"])
    if big:
        px(img, x + 2, y + 1, C["tie"])  # emblem hint
    px(img, x, y - 1, C["gold"])


def pennant(img, x, y, c=None):
    c = c or C["green"]
    px(img, x, y, C["iron"])
    px(img, x, y + 1, C["iron"])
    px(img, x + 1, y, c)
    px(img, x + 2, y, c)
    px(img, x + 1, y + 1, c)


def water_patch(img, x0, y0, x1, y1):
    rect(img, x0, y0, x1, y1, C["water_lt"])
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if (x * 7 + y * 3) % 11 == 0:
                px(img, x, y, C["water"])
            elif (x * 5 + y * 9) % 17 == 0:
                px(img, x, y, C["shallow"])


def planks(img, x0, y0, x1, y1, vertical=False):
    rect(img, x0, y0, x1, y1, C["wood"])
    if vertical:
        for y in range(y0, y1 + 1, 2):
            rect(img, x0, y, x1, y, C["rock_lt"])
        rect(img, x1, y0, x1, y1, C["rock"])
    else:
        for x in range(x0, x1 + 1, 2):
            rect(img, x, y0, x, y1, C["rock_lt"])
        rect(img, x0, y1, x1, y1, C["rock"])
    rect(img, x0, y0, x1 if not vertical else x0, y0 if not vertical else y1, C["sand_dk"])


def concrete(img, x0, y0, x1, y1, joints=True):
    rect(img, x0, y0, x1, y1, C["smoke_lt"])
    rect(img, x0, y0, x1, y0, C["chrome"])
    rect(img, x0, y0, x0, y1, C["chrome"])
    rect(img, x1, y0 + 1, x1, y1, C["smoke"])
    rect(img, x0 + 1, y1, x1, y1, C["smoke"])
    if joints:
        for x in range(x0 + 4, x1, 5):
            for y in range(y0 + 1, y1):
                if (x + y) % 3:
                    px(img, x, y, C["hull_lt"])


def gold_rim(img, x0, y0, x1, y1):
    for x in range(x0, x1 + 1):
        px(img, x, y0, C["gold"])
        px(img, x, y1, C["gold_dk"])
    for y in range(y0, y1 + 1):
        px(img, x0, y, C["gold"])
        px(img, x1, y, C["gold_dk"])


def sandbags(img, x0, y0, x1, y1):
    """A rectangular ring of sandbags with lumpy lit tops."""
    for x in range(x0, x1 + 1):
        for y in (y0, y1):
            px(img, x, y, C["sand_lt"] if (x + y) % 2 == 0 else C["sand"])
    for y in range(y0, y1 + 1):
        for x in (x0, x1):
            px(img, x, y, C["sand_lt"] if (x + y) % 2 == 0 else C["sand"])
    for x in range(x0 + 1, x1):
        px(img, x, y0 + 1, C["sand_dk"])
    for y in range(y0 + 1, y1):
        px(img, x0 + 1, y, C["sand_dk"])


def ring_bags(img, cx, cy, r, lit=None, mid=None, dk=None):
    lit, mid, dk = lit or C["sand_lt"], mid or C["sand"], dk or C["sand_dk"]
    for y in range(16):
        for x in range(16):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if r - 1.5 <= d <= r + 0.5:
                inner = d < r - 0.5
                if inner:
                    px(img, x, y, dk)
                else:
                    px(img, x, y, lit if (x - cx) + (y - cy) < 0 and (x + y) % 2 == 0 else mid)


def mount(img, gold=False):
    """Turret mount ring at the frame centre (pixels 5..10)."""
    disc(img, 7.5, 7.5, 2.9, C["iron"])
    circle(img, 7.5, 7.5, 2.6, C["gold"] if gold else C["deck"], thickness=0.8)
    rect(img, 7, 7, 8, 8, C["black"])


def crate(img, x, y, c=None):
    c = c or C["olive"]
    rect(img, x, y, x + 1, y + 1, c)
    px(img, x, y, C["olive_lt"])
    px(img, x + 1, y + 1, C["olive_dk"])


def drum(img, x, y):
    px(img, x, y, C["tie"])
    px(img, x, y + 1, C["maroon"])


def wheels(img, xs, y_top, y_bot):
    for x in xs:
        px(img, x, y_top, C["black"])
        px(img, x, y_bot, C["black"])


def truck(img, x0, y0, x1, y1, cab=3, body=None):
    """Top-down truck facing east: cargo bed + cab on the right, wheels poking out."""
    body = body or C["olive"]
    rect(img, x0, y0, x1, y1, body)
    rect(img, x0, y0, x1, y0, C["olive_lt"])
    rect(img, x1 - cab + 1, y0, x1, y1, C["olive_dk"])
    rect(img, x1 - cab + 2, y0 + 1, x1 - cab + 2, y1 - 1, C["water_dk"])  # windscreen
    px(img, x1, y0 + 1, C["fire_yellow"])
    px(img, x1, y1 - 1, C["fire_yellow"])
    wheels(img, range(x0 + 1, x1 - 1, 3), y0 - 1, y1 + 1)


def speedboat(img, x0, y, length, hull=None, deck=None, stripe=None, rows=4):
    """Boghammar-style speedboat pointing east (rows y..y+rows-1) with an outboard."""
    hull = hull or C["olive"]
    deck = deck or C["sand_dk"]
    x1 = x0 + length - 1
    mid = y + rows / 2 - 0.5
    for x in range(x0, x1 + 1):
        t = max(0, x - (x1 - 4)) / 4.0  # bow taper over the last 4 columns
        hw = rows / 2 * (1 - t * t * 0.75)
        for yy in range(y, y + rows):
            if abs(yy - mid) <= hw - 0.5 + 0.01:
                px(img, x, yy, hull)
    for x in range(x0 + 1, x1 - 3):
        for yy in range(y + 1, y + rows - 1):
            px(img, x, yy, deck)
    rect(img, x0, y, x1 - 4, y, C["olive_lt"])
    if stripe:
        rect(img, x0, y + rows - 1, x1 - 4, y + rows - 1, stripe)
    for yy in range(y + 1, y + rows - 1):  # outboard motor
        px(img, x0 - 1, yy, C["iron"])
    px(img, x0 - 1, y + rows - 2, C["black"])


def drone_boat(img, x0, y, gold=False):
    """Martyr explosive drone boat, 7x3, pointing east: black hull, red warhead nose."""
    rect(img, x0, y, x0 + 4, y + 2, C["iron"])
    rect(img, x0, y, x0 + 4, y, C["smoke"])
    rect(img, x0 + 5, y, x0 + 5, y + 2, C["tie"])
    px(img, x0 + 6, y + 1, C["fire_red"])
    px(img, x0 + 5, y, C["fire_orange"])
    px(img, x0 + 2, y + 1, C["black"])
    px(img, x0 + 3, y + 1, C["green"] if not gold else C["gold"])


def mine_ball(img, cx, cy):
    """Horned contact mine, 3x3 sphere + 4 horns."""
    rect(img, cx - 1, cy - 1, cx + 1, cy + 1, C["iron"])
    px(img, cx - 1, cy - 1, C["smoke"])
    px(img, cx + 1, cy + 1, C["black"])
    for dx, dy in ((0, -2), (0, 2), (-2, 0), (2, 0)):
        px(img, cx + dx, cy + dy, C["black"])


def delta(img, cx, y, small=False):
    """Shahed drone on its rail, nose up (north), delta wing."""
    px(img, cx, y, C["smoke"])
    rect(img, cx, y + 1, cx, y + 5, C["sand"])
    for k in range(1, 4):
        rect(img, cx - k, y + 1 + k, cx + k, y + 1 + k, C["sand_lt"])
    px(img, cx - 3, y + 4, C["smoke"])
    px(img, cx + 3, y + 4, C["smoke"])
    px(img, cx, y + 2, C["tie"])
    px(img, cx, y + 5, C["iron"])


def finish(fig, shadow=None):
    outline(fig)
    if shadow is None:
        return fig
    out = new(16, 16)
    for (x0, y0, x1, y1) in shadow:
        rect(out, x0, y0, x1, y1, SHADOW)
    out.alpha_composite(fig)
    return out


# ---------------------------------------------------------------------------
# towers

def boats(tier):
    img = new(16, 16)
    water_patch(img, 2, 1, 15, 12)
    if tier < 2:
        planks(img, 0, 12, 15, 14)
        planks(img, 0, 1, 2, 12, vertical=True)
    else:
        concrete(img, 0, 12, 15, 14)
        concrete(img, 0, 1, 2, 12, joints=False)
        for x in (5, 10, 15):
            px(img, x, 12, C["gold"])
    if tier == 2:  # a second boat moored along the top
        speedboat(img, 5, 1, 9, hull=C["olive"], rows=3)
    speedboat(img, 4, 5, 12, hull=C["olive"] if tier == 0 else C["olive_dk"], rows=6,
              stripe=C["gold"] if tier == 2 else (C["sand"] if tier == 1 else None))
    if tier >= 1:  # camo blotches
        for x, y in ((5, 6), (9, 9), (12, 6)):
            px(img, x, y, C["sand_dk"] if tier == 1 else C["olive"])
    px(img, 12, 7, C["water_dk"])  # windscreen
    px(img, 12, 8, C["water_dk"])
    if tier >= 1:
        for x in (6, 11):
            px(img, x, 11, C["black"])  # tyre fenders
        if tier == 1:
            drum(img, 1, 12)
            pennant(img, 0, 2)
        else:
            iran_flag(img, 1, 2, big=True)
    disc(img, 7.5, 7.5, 2.0, C["iron"])  # small pintle mount on the boat
    circle(img, 7.5, 7.5, 2.0, C["gold"] if tier == 2 else C["deck"], thickness=0.7)
    return finish(img)


def mines(tier):
    img = new(16, 16)
    water_patch(img, 1, 1, 14, 14)
    if tier == 2:
        concrete(img, 0, 13, 15, 15, joints=False)
    else:
        planks(img, 0, 13, 15, 15)
    # barge
    x0, x1 = 2, 13
    rect(img, x0, 3, x1, 11, C["olive"])
    rect(img, x0, 3, x1, 3, C["olive_lt"])
    rect(img, x0, 11, x1, 11, C["olive_dk"])
    rect(img, x1, 4, x1, 10, C["olive_dk"])
    rect(img, x0 + 1, 4, x1 - 1, 10, C["sand_dk"])
    for x in range(x0 + 2, x1, 3):
        rect(img, x, 4, x, 10, C["sand"])  # deck plates
    # mine rails toward the stern
    rect(img, x0 + 1, 6, x0 + 1, 8, C["iron"])
    spots = {0: [(6, 7), (10, 7)], 1: [(5, 5), (9, 5), (5, 9), (9, 9)],
             2: [(4, 5), (8, 5), (12, 5), (4, 9), (8, 9), (12, 9)]}[tier]
    if tier == 2:
        spots = [(5, 5), (8, 5), (11, 5), (5, 9), (8, 9), (11, 9)]
    for cx, cy in spots:
        mine_ball(img, cx, cy)
    if tier >= 1:
        # small crane on the bow
        rect(img, 12, 6, 12, 8, C["fire_yellow"] if tier == 1 else C["gold"])
        px(img, 13, 5, C["fire_yellow"] if tier == 1 else C["gold"])
        px(img, 14, 4, C["iron"])
    if tier == 2:
        gold_rim(img, x0, 3, x1, 11)
        iran_flag(img, 2, 0)
    elif tier == 1:
        pennant(img, 2, 1)
    return finish(img)


def martyr(tier):
    img = new(16, 16)
    water_patch(img, 3, 1, 15, 14)
    if tier < 2:
        planks(img, 0, 0, 2, 15, vertical=True)
    else:
        concrete(img, 0, 0, 2, 15, joints=False)
    rows = {0: [7], 1: [4, 10], 2: [2, 7, 12]}[tier]
    for y in rows:
        drone_boat(img, 4, y - 1, gold=tier == 2)
        px(img, 3, y, C["wood"])  # mooring line
    if tier >= 1:
        for y in (3, 9, 13):
            px(img, 2, y, C["black"])  # tyre fenders
    if tier == 2:
        # gold-roofed boat shed over the dock
        rect(img, 0, 0, 3, 4, C["gold"])
        rect(img, 0, 4, 3, 4, C["gold_dk"])
        px(img, 0, 0, C["cream"])
        iran_flag(img, 1, 9)
    elif tier == 1:
        pennant(img, 0, 10, C["tie"])
    return finish(img)


def aa_gun(tier):
    img = new(16, 16)
    if tier < 2:
        disc(img, 7.5, 7.5, 6.6, C["sand_dk"])  # dug-out pit floor
        ring_bags(img, 7.5, 7.5, 6.8)
        if tier == 1:
            ring_bags(img, 7.5, 7.5, 5.2, lit=C["sand"], mid=C["sand_dk"], dk=C["rock_lt"])
    else:
        disc(img, 7.5, 7.5, 7.2, C["smoke"])
        disc(img, 7.5, 7.5, 6.2, C["smoke_lt"])
        circle(img, 7.5, 7.5, 7.0, C["gold"], thickness=0.9)
        disc(img, 7.5, 7.5, 4.6, C["hull_lt"])
    # ammo crates
    crate(img, 3, 11)
    crate(img, 11, 3)
    if tier >= 1:
        crate(img, 11, 11)
        crate(img, 3, 3, C["olive_dk"])
    if tier == 1:  # camo netting draped over the rim
        for x, y in ((1, 6), (1, 8), (2, 5), (13, 9), (14, 7), (6, 14), (9, 14), (6, 1), (9, 1)):
            px(img, x, y, C["olive"])
    mount(img, gold=tier == 2)
    if tier == 2:
        iran_flag(img, 1, 0, big=True)
        # small fire-control dish
        disc(img, 13, 13, 1.6, C["chrome"])
        px(img, 13, 13, C["iron"])
    return finish(img)


def shahed(tier):
    img = new(16, 16)
    shadow = [(3, 10, 15, 15)]
    if tier == 0:
        # trailer with one drone on an angled rail
        rect(img, 4, 9, 11, 13, C["olive"])
        rect(img, 4, 9, 11, 9, C["olive_lt"])
        rect(img, 11, 10, 14, 11, C["iron"])  # tow bar
        wheels(img, (5, 9), 8, 14)
        rect(img, 7, 3, 8, 12, C["iron"])
        delta(img, 7, 2)
    elif tier == 1:
        truck(img, 2, 9, 14, 13, cab=3)
        for cx in (4, 9):
            rect(img, cx, 4, cx, 12, C["iron"])
        delta(img, 4, 2)
        delta(img, 9, 4)
        pennant(img, 13, 5)
    else:
        rect(img, 0, 13, 15, 15, C["smoke_lt"])  # launch pad
        rect(img, 0, 13, 15, 13, C["chrome"])
        truck(img, 1, 9, 14, 13, cab=3, body=C["olive_dk"])
        gold_rim(img, 1, 9, 11, 13)
        for cx in (3, 7, 11):
            rect(img, cx, 4, cx, 12, C["iron"])
        delta(img, 3, 3)
        delta(img, 7, 1)
        delta(img, 11, 3)
        iran_flag(img, 14, 3)
    return finish(img)


def jammer(tier):
    img = new(16, 16)
    truck(img, 1, 8, 14, 13, cab=3, body=C["olive"] if tier < 2 else C["olive_dk"])
    rect(img, 2, 9, 10, 12, C["olive_dk"])  # equipment shelter
    rect(img, 2, 9, 10, 9, C["olive_lt"])
    px(img, 9, 11, C["fire_yellow"])
    px(img, 8, 11, C["green"])
    if tier == 0:
        rect(img, 4, 2, 4, 9, C["iron"])  # whip antennas
        rect(img, 8, 4, 8, 9, C["iron"])
        px(img, 4, 1, C["tie"])
        px(img, 8, 3, C["tie"])
    elif tier == 1:
        rect(img, 3, 1, 3, 9, C["iron"])
        rect(img, 10, 3, 10, 9, C["iron"])
        rect(img, 5, 2, 8, 6, C["hull_dk"])  # log-periodic array panel
        for y in (3, 5):
            rect(img, 5, y, 8, y, C["hull_lt"])
        rect(img, 6, 7, 7, 8, C["iron"])
        px(img, 3, 0, C["tie"])
        px(img, 10, 2, C["fire_yellow"])
        pennant(img, 12, 4)
    else:
        # big dish on a mast
        rect(img, 7, 6, 8, 9, C["iron"])
        disc(img, 7.5, 4.0, 4.4, C["chrome"])
        circle(img, 7.5, 4.0, 4.0, C["gold"], thickness=0.9)
        disc(img, 7.5, 4.0, 2.4, C["hull_lt"])
        disc(img, 7.5, 4.0, 1.0, C["smoke"])
        for x, y in ((5, 2), (4, 3), (6, 1)):
            px(img, x, y, C["white"])
        px(img, 7, 4, C["fire_red"])  # feed horn
        rect(img, 1, 3, 1, 9, C["iron"])
        px(img, 1, 2, C["tie"])
        gold_rim(img, 1, 8, 11, 13)
        iran_flag(img, 13, 2)
    return finish(img)


def missile(tier):
    img = new(16, 16)
    if tier == 2:
        concrete(img, 0, 2, 15, 3, joints=False)  # revetment walls
        concrete(img, 0, 12, 15, 13, joints=False)
        gold_rim(img, 0, 2, 15, 3)
        gold_rim(img, 0, 12, 15, 13)
    # 8-wheel TEL chassis with a cab on the right
    rect(img, 1, 5, 14, 10, C["olive"])
    rect(img, 1, 5, 14, 5, C["olive_lt"])
    rect(img, 12, 5, 14, 10, C["olive_dk"])
    rect(img, 13, 6, 13, 9, C["water_dk"])
    wheels(img, (2, 4, 9, 11), 4, 11)
    rect(img, 1, 7, 2, 8, C["olive_dk"])  # rear jacks
    mount(img, gold=tier == 2)
    if tier >= 1:
        # camo net over the cab + a support crate
        for x, y in ((12, 5), (14, 6), (13, 10), (12, 8)):
            px(img, x, y, C["sand_dk"])
        if tier == 1:
            crate(img, 1, 12, C["olive_dk"])
            pennant(img, 1, 1)
    if tier == 2:
        iran_flag(img, 14, 8)
    return finish(img)


def radar(tier):
    img = new(16, 16)
    shadow = [(8, 12, 15, 15)]
    # concrete footing
    concrete(img, 3, 12, 12, 14, joints=False)
    top = {0: 6, 1: 4, 2: 4}[tier]
    # lattice mast (two legs with cross bracing), seen with a little height
    for y in range(top, 13):
        spread = (y - top) // 4
        px(img, 6 - spread, y, C["hull_dk"])
        px(img, 9 + spread, y, C["hull_dk"])
        if (y - top) % 2 == 0:
            for x in range(7 - spread, 9 + spread):
                px(img, x, y, C["hull"] if (x + y) % 2 else CLEAR)
    # antenna array on top
    if tier == 0:
        rect(img, 4, top - 2, 11, top - 1, C["hull_lt"])
        rect(img, 4, top - 1, 11, top - 1, C["hull"])
        for x in range(5, 11, 2):
            px(img, x, top - 2, C["white"])
    elif tier == 1:
        rect(img, 2, top - 3, 13, top - 1, C["hull_lt"])
        for x in range(3, 13, 2):
            rect(img, x, top - 3, x, top - 1, C["hull"])
        rect(img, 2, top - 3, 13, top - 3, C["white"])
        pennant(img, 12, 9)
    else:
        rect(img, 0, 0, 15, 3, C["hull_lt"])
        for x in range(1, 15, 2):
            rect(img, x, 1, x, 2, C["hull"])
        rect(img, 0, 0, 15, 0, C["gold"])
        rect(img, 0, 3, 15, 3, C["gold_dk"])
        px(img, 7, 1, C["tie"])
        px(img, 8, 1, C["green"])
        rect(img, 11, 9, 14, 12, C["olive"])  # control hut
        rect(img, 11, 9, 14, 9, C["olive_lt"])
        px(img, 13, 11, C["fire_yellow"])
        iran_flag(img, 1, 7)
    return finish(img, shadow)


def ghadir(tier):
    img = new(16, 16)
    water_patch(img, 2, 3, 15, 12)
    # U-shaped concrete pen open to the east
    concrete(img, 0, 1, 15, 2, joints=False)
    concrete(img, 0, 13, 15, 14, joints=False)
    concrete(img, 0, 3, 1, 12, joints=False)
    # midget submarine: dark cigar with a conning tower
    rect(img, 4, 7, 12, 8, C["iron"])
    if tier >= 1:  # bigger boat from tier 1
        rect(img, 5, 6, 11, 9, C["iron"])
    rect(img, 4, 7, 12, 7, C["smoke"])
    px(img, 13, 7, C["iron"])
    px(img, 13, 8, C["black"])
    px(img, 3, 7, C["deck"])  # screw
    px(img, 3, 8, C["deck"])
    rect(img, 8, 6, 9, 9, C["black"])  # conning tower
    px(img, 8, 6, C["smoke"])
    px(img, 9, 5, C["smoke_lt"])  # periscope
    for x in (4, 12):
        px(img, x, 9, a(C["foam"], 200))
    if tier >= 1:
        # camo net over the back of the pen + a gantry crane
        for y in range(3, 13):
            for x in range(2, 5):
                if (x + y) % 2 == 0:
                    px(img, x, y, C["olive"])
        rect(img, 6, 1, 6, 14, C["fire_yellow"] if tier == 1 else C["gold"])
        px(img, 6, 7, C["iron"])
    if tier == 2:
        gold_rim(img, 0, 1, 15, 2)
        gold_rim(img, 0, 13, 15, 14)
        rect(img, 12, 6, 12, 9, C["iron"])
        iran_flag(img, 1, 0)
    return finish(img)


def sam(tier):
    img = new(16, 16)
    concrete(img, 2, 2, 13, 13)
    if tier >= 1:
        sandbags(img, 0, 0, 15, 15)
    if tier == 2:
        gold_rim(img, 2, 2, 13, 13)
    # engagement radar box (bottom-left), facing east
    rect(img, 1, 11, 5, 14, C["olive"])
    rect(img, 1, 11, 5, 11, C["olive_lt"])
    rect(img, 4, 11, 5, 13, C["hull_lt"])  # phased-array face
    px(img, 5, 12, C["hull"])
    if tier >= 1:
        rect(img, 10, 1, 14, 4, C["olive_dk"])  # command post truck
        rect(img, 10, 1, 14, 1, C["olive"])
        px(img, 14, 2, C["water_dk"])
        px(img, 11, 3, C["green"])
    if tier == 2:
        rect(img, 0, 9, 1, 14, C["hull_lt"])  # big panel radar
        rect(img, 0, 9, 0, 14, C["white"])
        px(img, 1, 11, C["tie"])
        iran_flag(img, 13, 9)
    mount(img, gold=tier == 2)
    return finish(img)


def minaret(tier):
    img = new(16, 16)
    shadow = [(8, 12, 14, 15)]
    # plinth
    rect(img, 3, 12, 12, 14, C["sand"])
    rect(img, 3, 12, 12, 12, C["sand_lt"])
    rect(img, 12, 13, 12, 14, C["sand_dk"])
    rect(img, 7, 13, 8, 14, C["water_dk"])  # door
    top = {0: 4, 1: 3, 2: 4}[tier]
    # slender shaft with tile bands
    rect(img, 6, top, 9, 12, C["sand_lt"])
    rect(img, 9, top, 9, 12, C["sand_dk"])
    rect(img, 6, top, 6, 12, C["cream"])
    for y in (9, 11):
        rect(img, 6, y, 9, y, C["water_lt"])
    # balcony with loudspeakers
    by = top + 2
    rect(img, 5, by, 10, by, C["sand_dk"])
    rect(img, 5, by - 1, 10, by - 1, C["sand"])
    px(img, 4, by - 1, C["iron"])
    px(img, 11, by - 1, C["iron"])
    px(img, 3, by - 1, C["smoke"])
    px(img, 12, by - 1, C["smoke"])
    if tier >= 1:
        px(img, 4, by + 2, C["iron"])  # second speaker pair
        px(img, 11, by + 2, C["iron"])
        px(img, 3, by + 2, C["smoke"])
        px(img, 12, by + 2, C["smoke"])
    # green banner hanging down the shaft
    rect(img, 7, by + 1, 8, by + 5, C["green"])
    px(img, 7, by + 5, C["white"])
    px(img, 8, by + 4, C["white"])
    if tier >= 1:
        rect(img, 2, 12, 2, 14, C["iron"])  # side banner on a pole
        rect(img, 1, 9, 2, 11, C["tie"])
        px(img, 1, 10, C["white"])
        px(img, 2, 8, C["iron"])
    # cap
    if tier == 0:
        rect(img, 6, top - 1, 9, top - 1, C["sand_dk"])
        rect(img, 7, top - 2, 8, top - 2, C["sand_dk"])
        px(img, 7, top - 3, C["iron"])
    elif tier == 1:
        rect(img, 6, top - 2, 9, top - 1, C["water_lt"])
        rect(img, 7, top - 3, 8, top - 3, C["water_lt"])
        px(img, 7, top - 2, C["foam"])
        px(img, 7, top - 4, C["gold"])
    else:
        disc(img, 7.5, top - 1.5, 2.6, C["gold"])
        px(img, 6, top - 3, C["cream"])
        px(img, 9, top - 1, C["gold_dk"])
        rect(img, 6, top - 1, 9, top - 1, C["gold_dk"])
        px(img, 7, 0, C["gold"])
        px(img, 8, 0, C["gold"])
        rect(img, 5, by, 10, by, C["gold"])
        rect(img, 3, 12, 12, 12, C["gold"])
        iran_flag(img, 12, 5)
    return finish(img, shadow)


TOWERS = [boats, mines, martyr, aa_gun, shahed, jammer, missile, radar, ghadir, sam, minaret]


def build():
    frames = [fn(tier) for fn in TOWERS for tier in range(3)]
    assert len(frames) == FRAMES
    return strip(frames)
