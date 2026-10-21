// The plot, told in Big Don's DECREES between levels (tweet cards) with the Grey Turban's replies,
// plus in-game story beats. Big Don is a parody of Donald Trump cast as Sauron; the Grey Turban is
// an Ayatollah caricature cast as Gandalf. Every post and reply is fictional satire, not a real post,
// and the Tolkien nods are parodies, not quotations. Swear words are {word} and render bleeped, as in
// quotes.ts. Tweets stay at or under 220 characters and replies at or under 120 (tests/quotes.test.ts).

import type { Who } from './quotes';

/** Copy that differs by input scheme; resolved with byInput() at display time. */
export type InputText = string | { desktop: string; touch: string };

export interface Tweet {
  /** Who posts it (the avatar and handle on the card). */
  who: Who;
  text: InputText;
  /** Gag footer under the post. */
  stats?: string;
  /** One line back from the other side. */
  reply?: { who: Who; text: string };
}

/** Briefing cards shown before each level. Level 1's first three are the tutorial. */
export const TWEETS: Record<number, Tweet[]> = {
  1: [
    {
      who: 'don',
      text: 'DECREE: The Strait of Hormuz is now the STRAIT OF DON. My beautiful Navy sails through it tomorrow. Nobody can stop it. Especially not an old man in a tower. Thank you for your attention to this matter!',
      stats: 'REPOSTS 41K   SEEN BY THE EYE',
      reply: { who: 'aya', text: 'You shah-ll not pass, Donald.' },
    },
    {
      who: 'don',
      text: {
        desktop: 'They tell me the old man fights back by CLICKING a little card on the right, then CLICKING the sand. Speedboats on land, mines in the shallow water. Hatched squares only. So complicated. Sad!',
        touch: 'They tell me the old man fights back by DRAGGING a little card from the right onto the sand. Speedboats on land, mines in the shallow water. Hatched squares only. So complicated. Sad!',
      },
      stats: 'REPOSTS 3   LIKES 4',
      reply: { who: 'aya', text: 'He is not wrong, for once. Click or tap a tower you built to upgrade it, sell it or retarget it.' },
    },
    {
      who: 'don',
      text: {
        desktop: 'And he has to press START (or SPACE) for my ships to even come! Then they kill my ships and get RIALS. Very unfair. And if he is in trouble he hits the sea with his STICK. Key 1. I checked.',
        touch: 'And he has to press START for my ships to even come! Then they kill my ships and get RIALS. Very unfair. And if he is in trouble he taps STAFF and hits the sea with his STICK. I checked.',
      },
      stats: 'REPOSTS 12   COMMUNITY NOTE: HE DID CHECK',
      reply: { who: 'aya', text: 'Every ship that reaches my tower costs patience. At zero, we lose. Shall we?' },
    },
  ],
  2: [
    {
      who: 'don',
      text: 'I have formed a FELLOWSHIP. Of ships. A Fellowship of Ships. Nine of them. No, ninety. Cyclones! Very fast name. They break into smaller boats when sunk. That is called a FEATURE.',
      stats: 'REPOSTS 9K   LIKES 17K',
      reply: { who: 'aya', text: 'A fellowship that falls apart when struck. How very on brand.' },
    },
    {
      who: 'aya',
      text: 'New at the Sirik docks: the MARTYR BOAT DOCK. Build it in the shallows. Each drone boat runs up the lane into the oncoming fleet. Slow to reload. Spectacular when it lands.',
      stats: 'POSTED FROM A ROTARY PHONE',
      reply: { who: 'don', text: 'Boats driving AT boats. Illegal. I am making it illegal right now.' },
    },
  ],
  3: [
    {
      who: 'don',
      text: 'The EYE goes airborne. MQ-9 Reapers! Beautiful drones. They fly right over his silly boats. Boats cannot shoot UP. Everybody knows that. I learned it yesterday.',
      stats: 'REPOSTS 22K   LIKES 30K',
      reply: { who: 'aya', text: 'Then we shall look up. The AA PIT is ready on Larak.' },
    },
    {
      who: 'aya',
      text: 'Larak-dur, he calls this island. It is called Larak. The new AA PIT only shoots aircraft, but it shoots them a great deal. Put it where the lane runs close.',
      stats: 'POSTED BETWEEN PRAYERS',
    },
  ],
  4: [
    {
      who: 'don',
      text: 'NEW SHIPS: Littoral Combat Ships. Very fast. So fast they sometimes leave without the crew. Nobody can catch them. Red soil island? I will paint it gold.',
      stats: 'REPOSTS 15K   LIKES 26K',
      reply: { who: 'aya', text: 'Fast ships, meet slow drones. They have all the time in the world.' },
    },
    {
      who: 'aya',
      text: 'Two gifts from the red island. SHAHED RACK: long-range homing drones. EW JAMMER: no damage, but everything near it slows, and their satnav insists they are in Ohio.',
      stats: 'POSTED BY CARRIER PIGEON',
      reply: { who: 'don', text: 'My GPS says I am at a golf course. Nobody tell me otherwise.' },
    },
  ],
  5: [
    {
      who: 'don',
      text: 'BIG ANNOUNCEMENT: I am coming PERSONALLY. On my yacht. The MAR-A-LAGO. All gold. Destroyers too, Arleigh Burkes, ARMOURED. Your little bullets will bounce. Ping!',
      stats: 'REPOSTS 88K   LIKES 112K   GOLD 1',
      reply: { who: 'aya', text: 'Bullets bounce. Missiles do not. The coastal battery is ready.' },
    },
    {
      who: 'aya',
      text: 'COASTAL MISSILES now stand above Qeshm. Expensive, slow to reload, and armour means nothing to them. Rockets, mines and drone boats crack armour too. Machine guns will not.',
      stats: 'POSTED IN THE NARROWS',
    },
    {
      who: 'don',
      text: 'The narrows are very narrow. That is why they are called the narrows. I am sailing my yacht down them like a GOLDEN NEEDLE. Very elegant. JUST WATCH!',
      stats: 'REPOSTS 4K',
      reply: { who: 'aya', text: 'The golden needle. Let us see if it floats.' },
    },
  ],
  6: [
    {
      who: 'don',
      text: 'You cannot see my SUBMARINES. Virginia class. Invisible. Also Seahawk helicopters, which you CAN see, but that is fine, they are beautiful. Yacht is fine. Not sunk. Resting.',
      stats: 'REPOSTS 31K   LIKES 44K',
      reply: { who: 'aya', text: 'What cannot be seen cannot be shot. Unless you build a radar.' },
    },
    {
      who: 'aya',
      text: 'From the Grey Havens of Bandar Abbas: the GHADIR RADAR reveals hidden hulls for every tower nearby, and the GHADIR SUB hunts their submarines from the shallows. I may also now FATWA one ship: key 2.',
      stats: 'POSTED FROM THE HARBOUR',
      reply: { who: 'don', text: 'A FATWA on a BOAT. The boat has rights!' },
    },
  ],
  7: [
    {
      who: 'don',
      text: 'I am building a SECOND TOWER on Hengam. The Two Towers. Mine is taller. Also: F/A-18 Super Hornets. Very fast jets. Twice as fast as anything. They will zoom right past.',
      stats: 'REPOSTS 50K   LIKES 61K',
      reply: { who: 'aya', text: 'Two towers, and the lane crosses itself. Even the map is confused by him.' },
    },
    {
      who: 'aya',
      text: 'The BAVAR-373 SAM SITE: long range, homing, air only. The jets are fast; give them a long gauntlet. Where the lane crosses, one tower can guard both passes.',
      stats: 'POSTED FROM HENGAM',
    },
  ],
  8: [
    {
      who: 'don',
      text: 'Riders of Mordor-a-Lago! Ticonderoga cruisers, armoured, and my B-2. STEALTH BOMBER. You cannot see it. It drops two Hornets when it goes down. Which it will not.',
      stats: 'REPOSTS 70K   LIKES 90K',
      reply: { who: 'aya', text: 'A bomber nobody can see. Then radar beside the SAMs it is.' },
    },
    {
      who: 'aya',
      text: 'Bandar Lengeh raises the PROPAGANDA MINARET. Towers within earshot fire faster. Upgraded, it adds bounty and a Friday sermon that collects 100 RIALS every 30 seconds of battle.',
      stats: 'POSTED AT FULL VOLUME',
      reply: { who: 'don', text: 'MY posts are louder. 3 AM. Every night. You cannot compete.' },
    },
  ],
  9: [
    {
      who: 'don',
      text: 'The SIEGE begins. Wasp class assault ships. Huge. Full of helicopters and frigates. When you sink one, more come out. Like a pinata. A pinata of FREEDOM.',
      stats: 'REPOSTS 66K   LIKES 79K',
      reply: { who: 'aya', text: 'A floating box of more boats. Splash damage was invented for this.' },
    },
    {
      who: 'aya',
      text: 'The Tunbs are small and the lane is long. Nothing new to build: everything we have, upgraded and placed with care. Jammers at the bends. Missiles on the straights.',
      stats: 'POSTED FROM A VERY SMALL ISLAND',
    },
  ],
  10: [
    {
      who: 'don',
      text: 'FINAL DECREE. Nimitz carriers. Many. And ME, on the USS BIG DON. Golden supercarrier. The biggest ship ever. If one ship gets through, I WIN. Just one!',
      stats: 'REPOSTS 1.2M   LIKES 2M   THE EYE IS OPEN',
      reply: { who: 'aya', text: 'If it reaches my tower, it is over. So it will not reach my tower.' },
    },
    {
      who: 'aya',
      text: 'The Black Gate of Hormuz. Short lane, solid ground, no second chances. Every tower we know, every rial we have. And the staff. Always the staff.',
      stats: 'POSTED AT THE GATE',
      reply: { who: 'don', text: 'His STICK cannot stop a CARRIER. Can it? Somebody check.' },
    },
  ],
};

/** Shown after level 10, before the victory screen. */
export const ENDING: Tweet[] = [
  {
    who: 'don',
    text: 'We have completed the GREATEST RETREAT IN HISTORY. Nobody has ever retreated this well. Many experts are calling it a win. I am one of the experts.',
    stats: 'REPOSTS 2   LIKES 1 (BIG DON)',
    reply: { who: 'aya', text: 'Safe travels, Donald. Mind the shallows on the way out.' },
  },
  {
    who: 'don',
    text: 'The Strait of Hormuz was actually a VERY BAD strait. Boring. Wet. I am buying a much better strait. Greenland has one. Probably. Thank you for your attention to this matter!',
    stats: 'COMMUNITY NOTE: GREENLAND HAS SEVERAL',
  },
  {
    who: 'aya',
    text: 'The Strait was never his to open, nor mine to close. It is a strait. It sits there. Thank you, Guard. Now: tea.',
    stats: 'POSTED FROM THE TOP OF THE AYATOWER',
  },
];

/** In-game story beats: the Grey Turban speaks up at a wave start (or the boss), and Big Don answers. */
export interface Beat {
  level: number;
  /** 'wave:N' fires when wave N starts; 'boss' when the boss appears. */
  at: `wave:${number}` | 'boss';
  aya: string;
  don: string;
}

export const BEATS: Beat[] = [
  {
    level: 1,
    at: 'wave:5',
    aya: 'Halfway, and the tower still stands. Upgrade what works before you build what does not.',
    don: 'HALFWAY? I am already all the way. In my mind. Which is a very good mind.',
  },
  {
    level: 3,
    at: 'wave:4',
    aya: 'Look up. The drones care nothing for the shallows. Only the AA pit can reach them.',
    don: 'My drones have the best view. They can see his bald spot. Under the turban. I know it.',
  },
  {
    level: 5,
    at: 'boss',
    aya: 'There it is. Gold from bow to stern, and armoured. Bullets will not do. Missiles, mines, boats!',
    don: 'BEHOLD! The MAR-A-LAGO! Every porthole is a mirror so I can see myself sink. I will not sink.',
  },
  {
    level: 6,
    at: 'wave:3',
    aya: 'Something stirs beneath the harbour. The radar will show it. The mines will greet it.',
    don: 'Nothing beneath. NOTHING. Definitely not a submarine called the USS Sneaky.',
  },
  {
    level: 7,
    at: 'wave:6',
    aya: 'Jets. Too fast for the speedboats, too high for the mines. Let the SAMs speak.',
    don: 'TWICE the speed of sound! Or of something. Of a horse. Very fast horse.',
  },
  {
    level: 8,
    at: 'wave:8',
    aya: 'A shadow with wings. The B-2 is invisible until the radar finds it. Then it is merely expensive.',
    don: 'Two billion dollars and you cannot see it. Like my taxes. Very invisible.',
  },
  {
    level: 9,
    at: 'wave:10',
    aya: 'The siege thickens. Every great ship spills smaller ones. Hold the bends and keep upgrading.',
    don: 'He is TIRED. I can see it. He has been holding that staff since level one. Arms of spaghetti.',
  },
  {
    level: 10,
    at: 'boss',
    aya: 'So. The Eye itself comes down the Strait. One ship past me and all is lost. Everything we have!',
    don: 'IT IS ME! On the BIGGEST ship! Gold deck, giant eye, very flattering angle. Out of my WAY!',
  },
];
