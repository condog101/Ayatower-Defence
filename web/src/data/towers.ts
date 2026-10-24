// The Ayatower's defences, loosely based on Iran's real-world coastal arsenal. Fictional satire:
// stats are game numbers, not real capabilities. Phaser-free (imported by the headless sim tests).

import { sec } from '../sim/const';
import type { TowerDef, TowerKey } from '../sim/types';

export const TOWERS: Record<TowerKey, TowerDef> = {
  boats: {
    key: 'boats', name: 'SPEEDBOAT PIER', basis: 'IRGC Boghammar fast-attack boats', index: 0, aimed: true,
    pro: 'Cheap, fast firing', con: 'Bullets bounce off armour', placement: 'land', role: 'attack', unlockLevel: 1,
    base: { name: 'TWIN DSHK', cost: 180, range: 110, cooldown: sec(0.22), damage: 1, dmgKind: 'bullet', projectile: 'shot', speed: 420, hitsSea: true, hitsAir: false, blurb: 'Two heavy machine guns on a speedboat.' },
    paths: [
      { name: 'ROCKETS', tiers: [
        { name: '107MM ROCKETS', cost: 160, range: 120, cooldown: sec(0.6), damage: 2, dmgKind: 'explosive', projectile: 'shot', speed: 300, splash: 18, hitsSea: true, hitsAir: false, blurb: 'Rocket rack: small blasts that crack armour.' },
        { name: 'SWARM', cost: 300, range: 130, cooldown: sec(0.45), damage: 2, dmgKind: 'explosive', projectile: 'shot', speed: 320, splash: 18, multishot: 3, hitsSea: true, hitsAir: false, blurb: 'The whole pier sorties: three targets at once.' },
      ] },
      { name: 'FLAK SKIFFS', tiers: [
        { name: 'MANPADS SKIFFS', cost: 170, range: 125, cooldown: sec(0.18), damage: 2, dmgKind: 'bullet', projectile: 'shot', speed: 440, hitsSea: true, hitsAir: true, blurb: 'Light gunboats that also shoot down aircraft.' },
        { name: 'PICKET LINE', cost: 310, range: 150, cooldown: sec(0.12), damage: 2, dmgKind: 'bullet', projectile: 'shot', speed: 460, pierce: 2, hitsSea: true, hitsAir: true, blurb: 'A picket of gunboats: rounds punch through two.' },
      ] },
    ],
  },
  mines: {
    key: 'mines', name: 'MINE LAYER', basis: 'Sadaf-02 / EM-52 naval mines', index: 1, aimed: false,
    pro: 'Pierces armour, hits hidden subs', con: 'Mines run out; no air', placement: 'shallow', role: 'attack', unlockLevel: 1,
    base: { name: 'SADAF MINES', cost: 220, range: 90, cooldown: sec(1.8), damage: 12, dmgKind: 'mine', projectile: 'mine', maxAlive: 3, hitsSea: true, hitsAir: false, blurb: 'Drops up to 3 mines on the lane.' },
    paths: [
      { name: 'FIELD', tiers: [
        { name: 'EM-52 ROCKET MINES', cost: 180, range: 100, cooldown: sec(1.4), damage: 20, dmgKind: 'mine', projectile: 'mine', maxAlive: 5, splash: 24, hitsSea: true, hitsAir: false, blurb: '5 mines that leap up and burst.' },
        { name: 'SMART MINES', cost: 320, range: 110, cooldown: sec(1.1), damage: 35, dmgKind: 'mine', projectile: 'mine', maxAlive: 6, splash: 24, ignoreHp: 3, hitsSea: true, hitsAir: false, blurb: 'Ignore dinghies, wait for something worth it.' },
      ] },
      { name: 'DEPTH CHARGES', tiers: [
        { name: 'MOORED MINES', cost: 190, range: 100, cooldown: sec(2), damage: 50, dmgKind: 'mine', projectile: 'mine', maxAlive: 3, splash: 24, hitsSea: true, hitsAir: false, blurb: 'Three huge moored mines for big hulls.' },
        { name: 'LIMPET FIELD', cost: 340, range: 110, cooldown: sec(1.8), damage: 95, dmgKind: 'mine', projectile: 'mine', maxAlive: 4, splash: 30, subMult: 2, hitsSea: true, hitsAir: false, blurb: 'Limpets that cripple cruisers and double on subs.' },
      ] },
    ],
  },
  martyr: {
    key: 'martyr', name: 'MARTYR BOAT DOCK', basis: 'Explosive drone boats', index: 2, aimed: false,
    pro: 'Huge armour-piercing blast', con: 'Slow reload, boats can miss', placement: 'shallow', role: 'attack', unlockLevel: 2,
    base: { name: 'DRONE BOAT', cost: 320, range: 140, cooldown: sec(4.5), damage: 40, dmgKind: 'explosive', projectile: 'boat', speed: 90, splash: 40, maxAlive: 2, hitsSea: true, hitsAir: false, blurb: 'Sends an explosive boat up the lane.' },
    paths: [
      { name: 'HEAVY', tiers: [
        { name: 'HEAVY CHARGE', cost: 260, range: 150, cooldown: sec(4.2), damage: 70, dmgKind: 'explosive', projectile: 'boat', speed: 100, splash: 50, maxAlive: 2, hitsSea: true, hitsAir: false, blurb: 'Bigger warhead, bigger blast.' },
        { name: 'TWIN LAUNCH', cost: 420, range: 160, cooldown: sec(4), damage: 70, dmgKind: 'explosive', projectile: 'boat', speed: 110, splash: 50, maxAlive: 4, multishot: 2, hitsSea: true, hitsAir: false, blurb: 'Two boats per launch.' },
      ] },
      { name: 'SWARM SKIFFS', tiers: [
        { name: 'JET SKIFFS', cost: 250, range: 150, cooldown: sec(3), damage: 35, dmgKind: 'explosive', projectile: 'boat', speed: 170, splash: 40, maxAlive: 3, hitsSea: true, hitsAir: false, blurb: 'Faster, lighter boats, three at a time.' },
        { name: 'SKI SWARM', cost: 440, range: 160, cooldown: sec(3), damage: 32, dmgKind: 'explosive', projectile: 'boat', speed: 210, splash: 32, maxAlive: 5, multishot: 3, hitsSea: true, hitsAir: false, blurb: 'Three skiffs per launch, five on the water.' },
      ] },
    ],
  },
  aa_gun: {
    key: 'aa_gun', name: 'AA PIT', basis: 'ZU-23-2 anti-aircraft guns', index: 3, aimed: true,
    pro: 'Cheap, very fast vs aircraft', con: 'Air only (cannon path hits sea at tier 3)', placement: 'land', role: 'attack', unlockLevel: 3,
    base: { name: 'ZU-23', cost: 150, range: 90, cooldown: sec(0.16), damage: 1, dmgKind: 'bullet', projectile: 'hitscan', hitsSea: false, hitsAir: true, blurb: 'Twin 23mm cannon. Air targets only.' },
    paths: [
      { name: 'CANNON', tiers: [
        { name: 'QUAD ZU', cost: 140, range: 100, cooldown: sec(0.1), damage: 1, dmgKind: 'bullet', projectile: 'hitscan', hitsSea: false, hitsAir: true, blurb: 'Four barrels. More lead in the sky.' },
        { name: 'MESBAH', cost: 260, range: 110, cooldown: sec(0.07), damage: 1, dmgKind: 'bullet', projectile: 'hitscan', hitsSea: true, hitsAir: true, blurb: 'Radar-laid flak. Also strafes boats.' },
      ] },
      { name: 'FLAK', tiers: [
        { name: '37MM FLAK', cost: 150, range: 110, cooldown: sec(0.5), damage: 4, dmgKind: 'explosive', projectile: 'shot', speed: 380, splash: 16, hitsSea: false, hitsAir: true, blurb: 'Bursting shells shred swarms of aircraft.' },
        { name: 'RADAR FLAK', cost: 280, range: 130, cooldown: sec(0.4), damage: 4, dmgKind: 'explosive', projectile: 'shot', speed: 420, splash: 24, hitsSea: false, hitsAir: true, blurb: 'Radar-fused bursts, wider and further.' },
      ] },
    ],
  },
  shahed: {
    key: 'shahed', name: 'SHAHED RACK', basis: 'Shahed-136 loitering drones', index: 4, aimed: false,
    pro: 'Long range, homing, splash', con: 'Slow drones, slow reload', placement: 'land', role: 'attack', unlockLevel: 4,
    base: { name: 'SHAHED-136', cost: 360, range: 200, cooldown: sec(2.2), damage: 25, dmgKind: 'explosive', projectile: 'homing', speed: 110, splash: 20, hitsSea: true, hitsAir: false, blurb: 'A lawnmower with wings and a warhead.' },
    paths: [
      { name: 'JET', tiers: [
        { name: 'SHAHED-238', cost: 300, range: 210, cooldown: sec(2), damage: 30, dmgKind: 'explosive', projectile: 'homing', speed: 220, splash: 22, hitsSea: true, hitsAir: false, blurb: 'Jet-powered: twice as fast.' },
        { name: 'SALVO', cost: 450, range: 220, cooldown: sec(2), damage: 30, dmgKind: 'explosive', projectile: 'homing', speed: 220, splash: 22, multishot: 3, hitsSea: true, hitsAir: false, blurb: 'Three drones per launch.' },
      ] },
      { name: 'LOITER', tiers: [
        { name: 'ARASH', cost: 320, range: 260, cooldown: sec(3), damage: 60, dmgKind: 'explosive', projectile: 'homing', speed: 120, splash: 30, hitsSea: true, hitsAir: false, blurb: 'Long-range loitering drone, heavy warhead.' },
        { name: 'MOHAJER STRIKE', cost: 470, range: 300, cooldown: sec(2.6), damage: 70, dmgKind: 'explosive', projectile: 'homing', speed: 130, splash: 36, hitsSea: true, hitsAir: false, blurb: 'Reaches across the map.' },
      ] },
    ],
  },
  jammer: {
    key: 'jammer', name: 'EW JAMMER', basis: 'GPS spoofing / electronic warfare', index: 5, aimed: false,
    pro: 'Slows everything nearby', con: 'Does no damage', placement: 'land', role: 'support', unlockLevel: 4,
    base: { name: 'GPS SPOOFER', cost: 260, range: 100, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', slow: { mult: 0.6, ticks: 30 }, hitsSea: true, hitsAir: false, blurb: 'Ships in range sail at 60% speed.' },
    paths: [
      { name: 'CONTROL', tiers: [
        { name: 'WIDEBAND', cost: 220, range: 110, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', slow: { mult: 0.5, ticks: 30 }, hitsSea: true, hitsAir: true, blurb: 'Aircraft too, at 50% speed.' },
        { name: 'CAPTURE', cost: 380, range: 120, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', slow: { mult: 0.5, ticks: 30 }, stun: { ticks: sec(1.5), every: sec(10) }, hitsSea: true, hitsAir: true, blurb: 'Every 10 s everything in range freezes.' },
      ] },
      { name: 'TARGETING', tiers: [
        { name: 'TARGET DATALINK', cost: 230, range: 110, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', slow: { mult: 0.7, ticks: 30 }, paint: { mult: 1.2, ticks: 30 }, hitsSea: true, hitsAir: true, blurb: 'Painted targets in range take +20% damage.' },
        { name: 'KILL WEB', cost: 400, range: 140, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', slow: { mult: 0.7, ticks: 30 }, paint: { mult: 1.35, ticks: 30 }, hitsSea: true, hitsAir: true, blurb: 'Wider web, +35% damage taken.' },
      ] },
    ],
  },
  missile: {
    key: 'missile', name: 'COASTAL MISSILES', basis: 'Noor / Khalij Fars / Fattah', index: 6, aimed: true,
    pro: 'Massive armour-piercing hits', con: 'Expensive, slow reload', placement: 'land', role: 'attack', unlockLevel: 5,
    base: { name: 'NOOR', cost: 650, range: 260, cooldown: sec(3), damage: 90, dmgKind: 'missile', projectile: 'homing', speed: 260, hitsSea: true, hitsAir: false, blurb: 'Sea-skimming anti-ship missile.' },
    paths: [
      { name: 'STRIKE', tiers: [
        { name: 'KHALIJ FARS', cost: 500, range: 270, cooldown: sec(3), damage: 100, dmgKind: 'missile', projectile: 'splash', speed: 300, splash: 30, hitsSea: true, hitsAir: false, blurb: 'Ballistic: drops from the sky with splash.' },
        { name: 'FATTAH', cost: 900, range: 300, cooldown: sec(2.5), damage: 220, dmgKind: 'missile', projectile: 'hitscan', hitsSea: true, hitsAir: false, blurb: '"Hypersonic". Hits before you see it.' },
      ] },
      { name: 'CRUISE', tiers: [
        { name: 'GHADR', cost: 520, range: 320, cooldown: sec(2.4), damage: 130, dmgKind: 'missile', projectile: 'homing', speed: 320, splash: 20, hitsSea: true, hitsAir: false, blurb: 'Long-range cruise missile.' },
        { name: 'ABU MAHDI', cost: 880, range: 360, cooldown: sec(1.8), damage: 150, dmgKind: 'missile', projectile: 'homing', speed: 360, splash: 24, multishot: 2, hitsSea: true, hitsAir: false, blurb: 'Two cruise missiles per launch.' },
      ] },
    ],
  },
  radar: {
    key: 'radar', name: 'GHADIR RADAR', basis: 'Ghadir over-the-horizon radar', index: 7, aimed: false,
    pro: 'Reveals stealth nearby', con: 'Does no damage', placement: 'land', role: 'support', unlockLevel: 6,
    base: { name: 'OTH RADAR', cost: 240, range: 170, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', reveal: 170, hitsSea: true, hitsAir: true, blurb: 'Stealth ships and planes in range are revealed.' },
    paths: [
      { name: 'FIRE CONTROL', tiers: [
        { name: 'FIRE CONTROL', cost: 200, range: 170, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', reveal: 170, buff: { range: 1.15 }, hitsSea: true, hitsAir: true, blurb: 'Towers in range get +15% range.' },
        { name: 'TARGET LOCK', cost: 350, range: 180, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', reveal: 180, buff: { range: 1.15, dmg: 1.2 }, hitsSea: true, hitsAir: true, blurb: 'And +20% damage.' },
      ] },
      { name: 'EARLY WARNING', tiers: [
        { name: 'PHASED ARRAY', cost: 210, range: 220, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', reveal: 220, detectsSub: 220, buff: { range: 1.3 }, hitsSea: true, hitsAir: true, blurb: 'Sees further, finds subs, +30% range.' },
        { name: 'OVER-HORIZON NET', cost: 360, range: 260, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', reveal: 260, detectsSub: 260, buff: { range: 1.45 }, hitsSea: true, hitsAir: true, blurb: 'Towers in range get +45% range.' },
      ] },
    ],
  },
  ghadir: {
    key: 'ghadir', name: 'GHADIR MIDGET SUB', basis: 'Ghadir-class midget submarines', index: 8, aimed: false,
    pro: 'Hunts subs: detects and 2x damage', con: 'Short range, water only', placement: 'shallow', role: 'attack', unlockLevel: 6,
    base: { name: 'TORPEDO', cost: 340, range: 120, cooldown: sec(2.5), damage: 30, dmgKind: 'torpedo', projectile: 'shot', speed: 150, detectsSub: 120, subMult: 2, hitsSea: true, hitsAir: false, blurb: 'Detects submarines nearby.' },
    paths: [
      { name: 'HUNTER', tiers: [
        { name: 'QUICK RELOAD', cost: 280, range: 130, cooldown: sec(1.6), damage: 30, dmgKind: 'torpedo', projectile: 'shot', speed: 160, detectsSub: 130, subMult: 2, hitsSea: true, hitsAir: false, blurb: 'Faster reload.' },
        { name: 'WAKE HOMING', cost: 420, range: 140, cooldown: sec(1.5), damage: 35, dmgKind: 'torpedo', projectile: 'homing', speed: 170, pierce: 3, detectsSub: 140, subMult: 2, hitsSea: true, hitsAir: false, blurb: 'Homing torpedoes that punch through 3.' },
      ] },
      { name: 'AMBUSH', tiers: [
        { name: 'HEAVY TORPEDO', cost: 290, range: 130, cooldown: sec(3.2), damage: 70, dmgKind: 'torpedo', projectile: 'shot', speed: 140, detectsSub: 130, subMult: 2.5, hitsSea: true, hitsAir: false, blurb: 'One big fish, 2.5x on subs.' },
        { name: 'VALFAJR', cost: 440, range: 140, cooldown: sec(3), damage: 120, dmgKind: 'torpedo', projectile: 'shot', speed: 150, splash: 24, detectsSub: 140, subMult: 3, hitsSea: true, hitsAir: false, blurb: 'Heavyweight torpedo with a blast, 3x on subs.' },
      ] },
    ],
  },
  sam: {
    key: 'sam', name: 'BAVAR-373 SAM', basis: 'Bavar-373 air defence', index: 9, aimed: true,
    pro: 'Long range, homing vs air', con: 'Air only, slow reload', placement: 'land', role: 'attack', unlockLevel: 7,
    base: { name: 'BAVAR-373', cost: 420, range: 240, cooldown: sec(2), damage: 35, dmgKind: 'missile', projectile: 'homing', speed: 300, hitsSea: false, hitsAir: true, blurb: 'Long-range air defence missiles.' },
    paths: [
      { name: 'LONG RANGE', tiers: [
        { name: 'SAYYAD-4B', cost: 340, range: 280, cooldown: sec(1.8), damage: 50, dmgKind: 'missile', projectile: 'homing', speed: 340, hitsSea: false, hitsAir: true, blurb: 'Further and harder.' },
        { name: 'ARMAN', cost: 520, range: 290, cooldown: sec(1.6), damage: 50, dmgKind: 'missile', projectile: 'homing', speed: 360, multishot: 2, hitsSea: false, hitsAir: true, blurb: 'Two missiles per launch.' },
      ] },
      { name: 'POINT DEFENCE', tiers: [
        { name: '15 KHORDAD', cost: 330, range: 200, cooldown: sec(0.8), damage: 26, dmgKind: 'missile', projectile: 'homing', speed: 360, hitsSea: false, hitsAir: true, blurb: 'Shorter reach, rapid fire.' },
        { name: 'TALASH NET', cost: 500, range: 220, cooldown: sec(0.5), damage: 26, dmgKind: 'missile', projectile: 'homing', speed: 380, splash: 24, hitsSea: false, hitsAir: true, blurb: 'A web of interceptors that burst in swarms.' },
      ] },
    ],
  },
  minaret: {
    key: 'minaret', name: 'PROPAGANDA MINARET', basis: 'Loudspeakers and state TV', index: 10, aimed: false,
    pro: 'Nearby towers fire 25% faster', con: 'Does no damage', placement: 'land', role: 'support', unlockLevel: 8,
    base: { name: 'LOUDSPEAKER', cost: 300, range: 120, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', buff: { rate: 1.25 }, hitsSea: true, hitsAir: true, blurb: 'Towers in range fire 25% faster.' },
    paths: [
      { name: 'MEDIA', tiers: [
        { name: 'STATE TV', cost: 240, range: 120, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', buff: { rate: 1.25, bounty: 1.1 }, hitsSea: true, hitsAir: true, blurb: '+10% bounty on kills in range.' },
        { name: 'FRIDAY SERMON', cost: 380, range: 150, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', buff: { rate: 1.25, bounty: 1.1 }, income: { amount: 100, everyTicks: sec(30) }, hitsSea: true, hitsAir: true, blurb: 'Bigger reach, +100 RIALS every 30 s.' },
      ] },
      { name: 'CALL TO ARMS', tiers: [
        { name: 'WAR DRUMS', cost: 250, range: 120, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', buff: { rate: 1.25, dmg: 1.1 }, hitsSea: true, hitsAir: true, blurb: 'Towers in range hit 10% harder.' },
        { name: 'GRAND SERMON', cost: 390, range: 140, cooldown: 0, damage: 0, dmgKind: 'bullet', projectile: 'none', buff: { rate: 1.35, dmg: 1.15 }, hitsSea: true, hitsAir: true, blurb: 'Fire 35% faster and 15% harder.' },
      ] },
    ],
  },
};

export const TOWER_KEYS = Object.keys(TOWERS) as TowerKey[];
