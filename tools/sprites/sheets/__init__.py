"""Registry of sprite sheet modules. Each entry exposes NAME, FRAME=(w, h), FRAMES and build().

The order and names here are the contract with web/src (see test_gen.py EXPECTED).
"""
from . import (
    advisory,
    aya,
    ayatower,
    bosses,
    decor,
    don,
    enemies_air,
    enemies_sea,
    explosions,
    fx,
    hud_icons,
    projectiles,
    smoke,
    splash,
    tiles,
    title_logo,
    towers,
    turrets,
    ui_panel,
)

SHEETS = [
    # terrain + map dressing
    tiles,
    decor,
    # player
    towers,
    turrets,
    ayatower,
    # US Navy ships (all face east)
    enemies_sea.Rhib,
    enemies_sea.Patrol,
    enemies_sea.Cyclone,
    enemies_sea.Lcs,
    enemies_sea.Frigate,
    enemies_sea.Burke,
    enemies_sea.Sub,
    enemies_sea.Tico,
    enemies_sea.Lhd,
    enemies_sea.Carrier,
    bosses.Yacht,
    bosses.BigDon,
    # aircraft (all face east)
    enemies_air.Reaper,
    enemies_air.Seahawk,
    enemies_air.Hornet,
    enemies_air.B2,
    # projectiles
    projectiles.Bullet,
    projectiles.Rocket,
    projectiles.Missile,
    projectiles.Shahed,
    projectiles.Torpedo,
    projectiles.Mine,
    projectiles.Boat,
    projectiles.Sam,
    projectiles.Muzzle,
    # effects
    explosions.Small,
    explosions.Large,
    splash,
    smoke,
    fx.Stun,
    fx.Jam,
    fx.Ring,
    fx.Coin,
    # portraits + UI
    don,
    aya,
    title_logo,
    advisory,
    hud_icons,
    ui_panel,
]
