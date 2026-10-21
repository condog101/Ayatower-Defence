// The plot, told between levels as missives: Big Don's visions in the palantir and the Grey
// Turban's sealed scrolls, each with a one-line answer from the other side; plus in-game story
// beats. Big Don is a parody of Donald Trump cast as Sauron; the Grey Turban is an Ayatollah
// caricature cast as Gandalf. Everything is fictional satire, not a real statement, and the
// Tolkien nods are parodies, not quotations. Swear words are {word} and render bleeped, as in
// quotes.ts. Missives stay at or under 220 characters and answers at or under 120 (tests/quotes.test.ts).

import type { Who } from './quotes';

/** Copy that differs by input scheme; resolved with byInput() at display time. */
export type InputText = string | { desktop: string; touch: string };

export interface Missive {
  /** Who sends it: Don's come as visions in the stone, the Ayatower's as sealed scrolls. */
  who: Who;
  text: InputText;
  /** A line at the foot: the stone's glyphs, or the scroll's seal. */
  seal?: string;
  /** One line back from the other side. */
  reply?: { who: Who; text: string };
}

/** Missives shown before each level. Level 1's first three are the tutorial. */
export const MISSIVES: Record<number, Missive[]> = {
  1: [
    {
      who: 'don',
      text: 'HEAR ME. The Strait of Hormuz is now the Strait of MORDOR-A-LAGO. My precious fleet sails through it tomorrow. Nobody can stop it. Especially not an old man in a tower.',
      seal: 'SEEN IN THE STONE · THE EYE IS OPEN',
      reply: { who: 'aya', text: 'You shah-ll not pass, Donald.' },
    },
    {
      who: 'don',
      text: {
        desktop: 'My Nazgul report the old man fights by CLICKING a little card on the right, then CLICKING the sand. Piers on land, mines in the shallow water. Hatched squares only. So complicated. Sad!',
        touch: 'My Nazgul report the old man fights by DRAGGING a little card from the right onto the sand. Piers on land, mines in the shallow water. Hatched squares only. So complicated. Sad!',
      },
      seal: 'SEEN IN THE STONE · BY NINE NAZGUL AND ONE INTERN',
      reply: { who: 'aya', text: 'He is not wrong, for once. Click or tap a tower you built to upgrade it, sell it or retarget it.' },
    },
    {
      who: 'don',
      text: {
        desktop: 'And he must press START WAVE (or SPACE) before my ships even come! Each one he sinks pays him RIALS. Unfair. If he panics he strikes the sea with his STICK. Key 1. I checked.',
        touch: 'And he must press START WAVE on the left before my ships even come! Each one he sinks pays him RIALS. Unfair. If he panics he taps STAFF and strikes the sea with his STICK. I checked.',
      },
      seal: 'THE STONE CRACKED SLIGHTLY',
      reply: { who: 'aya', text: 'Every ship that reaches my tower costs patience. At none, we fall. Shall we?' },
    },
  ],
  2: [
    {
      who: 'don',
      text: 'I have formed a FELLOWSHIP. Of ships. Cyclones, very fast name. When you sink one, smaller boats come out. That is called a FEATURE. They will hug his cliffs all the way round.',
      seal: 'SEEN IN THE STONE · VERY CLEARLY',
      reply: { who: 'aya', text: 'A fellowship that falls apart when struck. How fitting.' },
    },
    {
      who: 'aya',
      text: 'The Sirik coast is all cliff and narrows: few places to build, so choose them well. New at the docks: the black-sailed skiffs of the MARTYR DOCK. They run up the lane into the fleet.',
      seal: 'SEALED WITH THE GREY SEAL',
      reply: { who: 'don', text: 'Boats sailing AT boats. Illegal. I am making it illegal right now.' },
    },
  ],
  3: [
    {
      who: 'don',
      text: 'The EYE takes to the air. My winged Reapers fly right over his silly boats. Boats cannot shoot UP. Everybody knows that. I learned it yesterday, from a Nazgul.',
      seal: 'SEEN IN THE STONE · FROM VERY HIGH UP',
      reply: { who: 'aya', text: 'Then we shall look up. The AA bastion is ready on Larak.' },
    },
    {
      who: 'aya',
      text: 'Larak-dur, he calls this island. It is called Larak. The lane coils round it, so the island rim is the place for short-reach towers; its high middle suits long guns. The AA bastion strikes only the sky.',
      seal: 'BY HAND OF A VERY OLD MAN',
    },
  ],
  4: [
    {
      who: 'don',
      text: 'NEW SHIPS: Littoral Combat Ships. So fast they sometimes leave without the crew. My orc-crews swim after them. The red island? I will paint it gold. And black.',
      seal: 'SEEN IN THE STONE · IN A HURRY',
      reply: { who: 'aya', text: 'Fast ships, meet patient drones.' },
    },
    {
      who: 'aya',
      text: 'Two gifts from Hormuz. The SHAHED ROOST: long-reaching homing wings. The JAMMER TENT: it wounds no one, but everything near it slows. The lane switchbacks wide; reach is everything here.',
      seal: 'SEALED IN RED HORMUZ CLAY',
      reply: { who: 'don', text: 'My compass says I am at Mordor-a-Lago. Nobody tell me otherwise.' },
    },
  ],
  5: [
    {
      who: 'don',
      text: 'I come PERSONALLY. On my yacht, the MAR-A-LAGO. All gold. Arleigh Burkes too, plated in Mordor iron: his little bullets go ping. Two channels, so he cannot watch both. Very smart.',
      seal: 'SEEN IN THE STONE · IN GOLD',
      reply: { who: 'aya', text: 'Bullets bounce. Bolts from the keep do not.' },
    },
    {
      who: 'aya',
      text: 'The KEEP OF THE GREAT BOW stands above Qeshm: costly, slow, and plate means nothing to it. The main channel and the northern creek meet before my tower; watch where they join.',
      seal: 'SEALED IN THE NARROWS',
    },
  ],
  6: [
    {
      who: 'don',
      text: 'You cannot see my SUBMARINES. Wrapped in shadow, like a ring. One fleet from the south, one from the east, both into his little harbour. The yacht is fine. Resting. Underwater.',
      seal: 'SEEN IN THE STONE · BARELY',
      reply: { who: 'aya', text: 'What cannot be seen cannot be shot. Unless you build a radar.' },
    },
    {
      who: 'aya',
      text: 'From the Grey Havens of Bandar Abbas: the SEEING-STONE reveals hidden hulls to every tower near it, and the GHADIR hunts submarines from the reeds. I may now also speak a FATWA on one ship (key 2).',
      seal: 'SEALED AT THE HARBOUR WALL',
      reply: { who: 'don', text: 'A FATWA on a BOAT. The boat has feelings!' },
    },
  ],
  7: [
    {
      who: 'don',
      text: 'I am raising a SECOND TOWER on Hengam. The Two Towers. Mine is taller. And Super Hornets, twice as fast as anything. They fly their own road across the sky. He will never guess where.',
      seal: 'SEEN IN THE STONE · TWICE',
      reply: { who: 'aya', text: 'Two towers, and his sea lane ties itself in a knot. Even the map is confused by him.' },
    },
    {
      who: 'aya',
      text: 'The TWIN-BALLISTA tower: great reach, sky only. The jets keep to a straight air road over Hengam; set the sky towers along it. Where the sea lane crosses itself, one tower can hold two passes.',
      seal: 'SEALED AT HENGAM',
    },
  ],
  8: [
    {
      who: 'don',
      text: 'Riders of Mordor-a-Lago! Ticonderoga cruisers, iron-plated, and my fell-beast bomber, invisible. A pincer, from the west AND the east. Very clever. I saw it in a film.',
      seal: 'SEEN IN THE STONE · THE EYE IS VERY OPEN',
      reply: { who: 'aya', text: 'A beast nobody can see. Then a seeing-stone on each flank it is.' },
    },
    {
      who: 'aya',
      text: 'Lengeh raises the MINARET OF COUNSEL. Towers in earshot fire faster; raised higher it adds bounty, and a Friday sermon that gathers 100 RIALS each 30 seconds of battle. Hold both flanks.',
      seal: 'SEALED AT FULL VOLUME',
      reply: { who: 'don', text: 'MY tower is louder. It screams. All night.' },
    },
  ],
  9: [
    {
      who: 'don',
      text: 'The SIEGE begins. Wasp assault ships. Huge. Full of helicopters and frigates. Sink one and more come out, like a pinata. Two fleets weaving round three islands. He will get so dizzy.',
      seal: 'SEEN IN THE STONE · WHILE SPINNING',
      reply: { who: 'aya', text: 'A floating box of more boats. Splash damage was made for this.' },
    },
    {
      who: 'aya',
      text: 'The Tunbs are small and the lanes cross once between them. Nothing new to build: everything we have, raised high and set with care. Jammers at the bends, keeps on the long runs.',
      seal: 'SEALED ON A VERY SMALL ISLAND',
    },
  ],
  10: [
    {
      who: 'don',
      text: 'FINAL DECREE. Nimitz carriers. Many. And ME, on the USS BIG DON, a golden supercarrier with towers of Barad-dur. If ONE ship reaches his tower, I win. Just one!',
      seal: 'SEEN IN THE STONE · THE EYE IS WIDE OPEN',
      reply: { who: 'aya', text: 'If it reaches my tower, it is over. So it will not reach my tower.' },
    },
    {
      who: 'aya',
      text: 'The Black Gate of Hormuz: two short lanes through a wall of rock, and little ground to build on. Every tower we know, every rial we have. And the staff. Always the staff.',
      seal: 'SEALED AT THE GATE',
      reply: { who: 'don', text: 'His STICK cannot stop a CARRIER. Can it? Somebody check.' },
    },
  ],
};

/** Shown after level 10, before the victory screen. */
export const ENDING: Missive[] = [
  {
    who: 'don',
    text: 'We have completed the GREATEST RETREAT in the history of Middle-earth. Nobody has ever retreated this well. Many experts call it a win. I am all of the experts.',
    seal: 'THE STONE IS VERY CLOUDY',
    reply: { who: 'aya', text: 'Safe travels, Donald. Mind the shallows on the way out.' },
  },
  {
    who: 'don',
    text: 'The Strait of Hormuz was actually a BAD strait. Boring. Wet. I am getting a much better strait. With lava. Mordor has several. Probably.',
    seal: 'THE STONE HAS GONE DARK',
  },
  {
    who: 'aya',
    text: 'The Strait was never his to open, nor mine to close. It is a strait. It sits there. Thank you, friend. Now: tea.',
    seal: 'SEALED FROM THE TOP OF THE AYATOWER',
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
    aya: 'Halfway, and the tower still stands. Raise what works before you build what does not.',
    don: 'HALFWAY? I am already all the way. In my mind. Which is a very good mind. The best.',
  },
  {
    level: 3,
    at: 'wave:4',
    aya: 'Look up. Winged things care nothing for the shallows. Only the AA bastion can reach them.',
    don: 'My flyers have the best view. They can see his bald spot. Under the turban. I know it.',
  },
  {
    level: 5,
    at: 'boss',
    aya: 'There it is. Gold from bow to stern, and plated. Bullets will not do. Bolts, mines, fire-boats!',
    don: 'BEHOLD the MAR-A-LAGO! Every porthole is a mirror so I can watch myself win. I will win.',
  },
  {
    level: 6,
    at: 'wave:3',
    aya: 'Something stirs beneath the harbour. The seeing-stone will show it; the mines will greet it.',
    don: 'Nothing beneath. NOTHING. Definitely not a submarine called the Precious.',
  },
  {
    level: 7,
    at: 'wave:6',
    aya: 'Jets on their sky road. Too fast for the piers, too high for the mines. Let the twin ballistae speak.',
    don: 'TWICE the speed of sound! Or of something. Of a fell-beast. A very fast fell-beast.',
  },
  {
    level: 8,
    at: 'wave:8',
    aya: 'A shadow with wings. The bomber is unseen until a seeing-stone finds it. Then it is merely expensive.',
    don: 'You cannot see it. Like my taxes. Very invisible. Totally invisible.',
  },
  {
    level: 9,
    at: 'wave:10',
    aya: 'The siege thickens. Every great ship spills smaller ones. Hold the bends and keep raising your towers.',
    don: 'He is TIRED. He has held that staff since the first level. Arms of spaghetti.',
  },
  {
    level: 10,
    at: 'boss',
    aya: 'So. The Eye itself comes down the Strait. One ship past me and all is lost. Everything we have!',
    don: 'IT IS ME! On the BIGGEST ship! Gold deck, giant Eye, a very flattering angle. Out of my WAY!',
  },
];
