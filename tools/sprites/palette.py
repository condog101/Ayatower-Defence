"""Shared 40-colour palette for every generated sprite sheet (Ayatower Defence).

Persian Gulf turquoise water, warm sand and red Hormuz soil, US Navy haze grey,
IRGC olive, Big Don's gold and orange tan, Mordor maroon, and the Grey Turban's
smoke greys. Colours are RGBA tuples. Keep this list at 40 entries so the art
stays coherent; LibreSprite users can load these as a palette when touching up.

Ramps use x_lt / x / x_dk naming. Some entries double up on purpose:
  - smoke_lt / smoke / iron are also the Grey Turban's turban + robe ramp,
  - iron is also Big Don's black-iron helmet,
  - tie is also the red of the Iranian flag, green its green,
  - gold / gold_dk / fire_yellow / cream are Big Don's swept hair,
  - rock_lt / rock double as weathered timber shadows next to wood.
"""

PALETTE = {
    # outlines / neutrals
    "black": (16, 14, 22, 255),
    "white": (244, 244, 236, 255),
    "cream": (243, 234, 215, 255),
    "smoke_lt": (168, 166, 170, 255),
    "smoke": (112, 110, 118, 255),
    "iron": (52, 50, 60, 255),
    # fire
    "fire_red": (196, 40, 32, 255),
    "fire_orange": (238, 112, 30, 255),
    "fire_yellow": (252, 214, 70, 255),
    # Persian Gulf water (turquoise -> deep teal)
    "foam": (214, 242, 236, 255),
    "shallow": (78, 196, 186, 255),
    "water_lt": (36, 150, 162, 255),
    "water": (22, 110, 136, 255),
    "water_dk": (14, 70, 104, 255),
    # land: sand, red Hormuz soil, rock
    "sand_lt": (240, 218, 166, 255),
    "sand": (222, 188, 126, 255),
    "sand_dk": (186, 146, 90, 255),
    "soil": (170, 76, 50, 255),
    "rock_lt": (142, 106, 86, 255),
    "rock": (98, 70, 60, 255),
    "rock_dk": (60, 42, 42, 255),
    # US Navy haze grey hull / deck
    "hull_lt": (178, 188, 196, 255),
    "hull": (134, 146, 158, 255),
    "hull_dk": (92, 102, 114, 255),
    "deck": (62, 68, 80, 255),
    # IRGC olive / khaki
    "olive_lt": (156, 156, 96, 255),
    "olive": (110, 114, 62, 255),
    "olive_dk": (70, 74, 42, 255),
    # skin (caricatures + crew)
    "skin_lt": (250, 200, 150, 255),
    "skin": (236, 148, 72, 255),
    "skin_dk": (188, 98, 50, 255),
    # Big Don gold / chrome
    "gold": (255, 214, 72, 255),
    "gold_dk": (186, 140, 30, 255),
    "chrome": (222, 228, 236, 255),
    # suit / tie / flag
    "suit": (28, 32, 58, 255),
    "tie": (210, 30, 44, 255),
    "maroon": (98, 18, 28, 255),
    "green": (34, 142, 74, 255),
    # timber, dusk sky
    "wood": (156, 100, 54, 255),
    "dusk": (112, 64, 124, 255),
}

assert len(PALETTE) == 40, len(PALETTE)

C = PALETTE  # short alias for sheet modules
