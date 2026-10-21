"""Shared 40-colour palette for every generated sprite sheet (Ayatower Defence).

Tolkien high fantasy in a 16-bit key: moss and meadow grass, slate stone, sun-bleached sand,
parchment, black iron, ember fire, mithril blue, Mordor red, deep teal sea, a starlit night,
plus the caricature ramps (skin, Big Don's gold hair, the Grey Turban's robe greys and white
beard). Colours are RGBA tuples. Keep this list at 40 entries so the art stays coherent;
LibreSprite users can load these as a palette when touching up.

Ramps use x_lt / x / x_dk naming. Some entries double up on purpose:
  - smoke_lt / smoke / iron are the Grey Turban's turban + robe ramp and Mordor's black iron,
  - white is the wizard's beard and the snow on the peaks, cream the lightest parchment,
  - gold / gold_dk / fire_yellow are Big Don's swept hair (and every bit of gaudy trim),
  - tie is Big Don's red tie and the red of the Eye; maroon is Mordor's dried-blood red,
  - mithril_lt / mithril are runes, crystals, the wizard's staff light and magic sparks,
  - night / dusk are the starlit sky and the purple of wizardry.
"""

PALETTE = {
    # outlines / neutrals / parchment
    "black": (14, 12, 20, 255),
    "white": (240, 240, 232, 255),
    "cream": (240, 228, 196, 255),
    "parch": (214, 188, 138, 255),
    "parch_dk": (160, 124, 82, 255),
    # robe greys / black iron / smoke
    "smoke_lt": (172, 170, 176, 255),
    "smoke": (114, 110, 122, 255),
    "iron": (52, 50, 62, 255),
    # ember fire
    "fire_red": (196, 40, 32, 255),
    "fire_orange": (236, 116, 32, 255),
    "fire_yellow": (252, 212, 80, 255),
    # deep teal sea
    "foam": (208, 236, 226, 255),
    "shallow": (62, 150, 144, 255),
    "water_lt": (30, 108, 118, 255),
    "water": (20, 74, 94, 255),
    "water_dk": (12, 44, 66, 255),
    # sand + meadow / moss
    "sand_lt": (232, 212, 158, 255),
    "sand": (202, 172, 112, 255),
    "sand_dk": (152, 118, 74, 255),
    "grass_lt": (140, 178, 74, 255),
    "grass": (88, 134, 56, 255),
    "grass_dk": (48, 86, 46, 255),
    "moss": (112, 118, 50, 255),
    # slate stone
    "stone_lt": (142, 152, 164, 255),
    "stone": (94, 102, 118, 255),
    "stone_dk": (56, 60, 78, 255),
    # skin (caricatures + crew)
    "skin_lt": (246, 200, 156, 255),
    "skin": (226, 148, 86, 255),
    "skin_dk": (174, 98, 58, 255),
    # gold / mithril-white chrome
    "gold": (252, 206, 72, 255),
    "gold_dk": (178, 130, 34, 255),
    "chrome": (220, 228, 238, 255),
    # Mordor red
    "tie": (208, 30, 42, 255),
    "maroon": (98, 18, 28, 255),
    # timber
    "wood": (142, 92, 52, 255),
    "wood_dk": (86, 54, 36, 255),
    # mithril blue / runes
    "mithril_lt": (150, 212, 250, 255),
    "mithril": (70, 128, 210, 255),
    # starlit night / wizardry
    "night": (20, 24, 54, 255),
    "dusk": (98, 60, 128, 255),
}

assert len(PALETTE) == 40, len(PALETTE)

C = PALETTE  # short alias for sheet modules
