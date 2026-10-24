// The plot, told between levels as missives: Sour-don the Orange's visions in the palantir and the Grey
// Turban's sealed scrolls, each with a one-line answer from the other side; plus in-game story
// beats. Sour-don the Orange is a parody of Donald Trump cast as Sauron; the Grey Turban is an Ayatollah
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
      reply: { who: 'aya', text: 'You shah-ll not pass, Sour-don.' },
    },
    {
      who: 'don',
      text: {
        desktop: 'My Nazgul report the old man fights by CLICKING a little card on the right, then CLICKING the sand. Piers on land, mines in the shallow water. Hatched squares only. So complicated. Sad!',
        touch: 'My Nazgul report the old man fights by DRAGGING a little card from the right onto the sand. Piers on land, mines in the shallow water. Hatched squares only. So complicated. Sad!',
      },
      seal: 'SEEN IN THE STONE · BY NINE NAZGUL AND ONE INTERN',
      reply: { who: 'aya', text: 'He is not wrong, for once. Click or tap a tower you built to upgrade it down one of two roads, or sell it.' },
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
      text: 'FINAL DECREE. Nimitz carriers. Many. And ME, on the USS SOUR-DON, a golden supercarrier with towers of Barad-dur. If ONE ship reaches his tower, I win. Just one!',
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
  11: [
    {
      who: 'don',
      text: 'SURPRISE! The greatest retreat was a FEINT. A genius feint. I am back, up the whole Gulf, with ZUMWALT destroyers. Stealthy AND armoured. You cannot see them and you cannot hurt them. Checkmate.',
      seal: 'SEEN IN THE STONE · THE EYE IS BACK',
      reply: { who: 'aya', text: 'A ship that hides and wears plate. Then the seeing-stone finds it and the bolts open it.' },
    },
    {
      who: 'aya',
      text: 'Kish is a resort island, all sand and pleasure-domes, and the lane winds right round it. Hear me: every tower now has TWO ROADS of upgrade. Choose one. You cannot walk both.',
      seal: 'SEALED ON KISH',
      reply: { who: 'don', text: 'Two roads? I take both roads. I take ALL the roads. I own roads.' },
    },
  ],
  12: [
    {
      who: 'don',
      text: 'Hovercraft! They do not even TOUCH the water. They fly over it, very low, very fast, full of patrol boats. My hovercraft are faster than anything. Except jets. And some ducks.',
      seal: 'SEEN IN THE STONE · BLURRY, THEY ARE FAST',
      reply: { who: 'aya', text: 'Then let them run into the mines. The water need not be touched to burn.' },
    },
    {
      who: 'aya',
      text: 'The Lavan shoals are wide and shallow: two lanes, one from the west and one from the south, meeting late. Good ground for mines and docks. The depth-charge road suits big hulls.',
      seal: 'SEALED ON THE SHOALS',
    },
  ],
  13: [
    {
      who: 'don',
      text: 'The F-35. The most expensive plane ever made. It is invisible, it is fast, and it is very, very expensive. Did I say expensive? I am saying it because it is a good thing.',
      seal: 'SEEN IN THE STONE · THE PRICE TAG ALONE',
      reply: { who: 'aya', text: 'Invisible and fast. So: a seeing-stone near every AA pit.' },
    },
    {
      who: 'aya',
      text: 'Abu Musa. Three lanes come at us, from the north, the east and the south, and almost no ground to stand on. Build where you can see all three, and let nothing hide.',
      seal: 'SEALED ON ABU MUSA',
      reply: { who: 'don', text: 'Three lanes! Three hunters! Like that film. Which I also own.' },
    },
  ],
  14: [
    {
      who: 'don',
      text: 'I have made a SKY ROAD over Siri. Straight. Very straight. My jets go down it like a golf cart down the eighteenth fairway. Wide fairway. Beautiful fairway. Nobody plays it better.',
      seal: 'SEEN IN THE STONE · FROM THE CLUBHOUSE',
      reply: { who: 'aya', text: 'A road that does not bend is a road a ballista can wait on.' },
    },
    {
      who: 'aya',
      text: 'Siri: two sea lanes and the sky road between them. Line the sky road with the twin ballistae and the flak. The cannon road of the AA pit stays useful at sea.',
      seal: 'SEALED ON SIRI',
    },
  ],
  15: [
    {
      who: 'don',
      text: 'I am coming PERSONALLY. Again. On AIR FARCE ONE. It is a golden jumbo jet. It is the biggest plane. It has a ballroom, and a smaller plane inside the ballroom. For emergencies.',
      seal: 'SEEN IN THE STONE · FIRST CLASS',
      reply: { who: 'aya', text: 'He flies. So the piers and mines sit idle, and the sky towers must do it all.' },
    },
    {
      who: 'aya',
      text: 'Asaluyeh\'s gas fields: two lanes among the oil platforms and a sky road over all. The jumbo flies the sky road, spilling bombers and jets. Every SAM and AA pit we have, on that road.',
      seal: 'SEALED AMONG THE FLARES',
      reply: { who: 'don', text: 'Gas field? It is a GOLF field. Long holes. Very windy. Like me.' },
    },
  ],
  16: [
    {
      who: 'don',
      text: 'The OHIO. The biggest submarine. It is a submarine FULL of submarines. When you sink it, more submarines come out. Submarines all the way down. I invented this. Probably.',
      seal: 'SEEN IN THE STONE · FROM BELOW',
      reply: { who: 'aya', text: 'Then the Ghadirs hunt, and the mines wait, and the seeing-stone keeps watch.' },
    },
    {
      who: 'aya',
      text: 'The Bushehr roads run long through mudflats and dead marshes. One lane, very long, many shallows. Do not follow the lights in the water. Follow the mines instead.',
      seal: 'SEALED IN THE MARSHES',
      reply: { who: 'don', text: 'Dead marshes? They are not dead. They are resting. Like my ratings.' },
    },
  ],
  17: [
    {
      who: 'don',
      text: 'Farsi Island. It is a tiny island. Very tiny. Hardly an island. I will surround it with THREE fleets and he will have nowhere to stand. He will have to stand in the water. Like a duck.',
      seal: 'SEEN IN THE STONE · VERY SMUG',
      reply: { who: 'aya', text: 'Then we stand in the water. The docks and the mines were made for it.' },
    },
    {
      who: 'aya',
      text: 'The last homely rock: a scrap of land and three lanes round it. Most of our strength must go in the shallows. Martyr docks, mines and Ghadirs, and the radar on the one good rock.',
      seal: 'SEALED ON THE LAST ROCK',
    },
  ],
  18: [
    {
      who: 'don',
      text: 'Kharg Terminal. Where the oil comes out. I am taking it. Every ship I have, two lanes, crossing twice so he gets dizzy. He is very old. Old men get dizzy. I never get dizzy.',
      seal: 'SEEN IN THE STONE · NOT DIZZY',
      reply: { who: 'aya', text: 'Where the lanes cross, one tower reaches both. Build at the crossings.' },
    },
    {
      who: 'aya',
      text: 'The Siege of Kharg. Everything he has thrown at us before, and more of it. Two lanes that cross twice. Mix your roads: some towers for the plated, some for the swarms, some for the sky.',
      seal: 'SEALED AT THE TERMINAL',
      reply: { who: 'don', text: 'A siege? I love sieges. Sieges are like golf. You surround the hole.' },
    },
  ],
  19: [
    {
      who: 'don',
      text: 'Khor Musa. A very long channel. It doubles back THREE times. My fleet will sail so long he will fall asleep. Then: WIN. I call it the endurance strategy. I have great endurance.',
      seal: 'SEEN IN THE STONE · STILL GOING',
      reply: { who: 'aya', text: 'Long lanes give long towers long work. Slow them, and keep slowing them.' },
    },
    {
      who: 'aya',
      text: 'The paths of the drowned: one tidal channel that folds three times. Jammers at the folds, and the targeting road where the fleet bunches. Patience, now, of every kind.',
      seal: 'SEALED AT THE FOLD',
    },
  ],
  20: [
    {
      who: 'don',
      text: 'MORDOR-A-LAGO. My floating resort. Gold hotel, pool, a giant Eye on top, and a golf course. It sails up the Arvand Rud with carriers, Zumwalts and forty jets. If it docks at his tower, the Gulf is mine.',
      seal: 'SEEN IN THE STONE · FROM THE PENTHOUSE',
      reply: { who: 'aya', text: 'Then it must not dock. Three lanes, one last run. Everything, now.' },
    },
    {
      who: 'aya',
      text: 'Arvand Rud: three channels that funnel into one short final run before the tower. Build deep at the funnel, where all three meet. This is the last road. Walk it well.',
      seal: 'SEALED AT THE MOUTH OF THE RIVER',
      reply: { who: 'don', text: 'Last road? I have many roads. I told you. I own roads.' },
    },
  ],
};

/** Shown after level 10, between the acts: Sour-don's greatest retreat (which was a feint). */
export const INTERLUDE: Missive[] = [
  {
    who: 'don',
    text: 'We have completed the GREATEST RETREAT in the history of Middle-earth. Nobody has ever retreated this well. Many experts call it a win. I am all of the experts.',
    seal: 'THE STONE IS VERY CLOUDY',
    reply: { who: 'aya', text: 'Safe travels, Sour-don. Mind the shallows on the way out.' },
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

/** Shown after level 20, before the victory screen. */
export const ENDING: Missive[] = [
  {
    who: 'don',
    text: 'Mordor-a-Lago has SUNK. It was not sinking, it was diving. It is a submarine now. A golden submarine. It was always a submarine. Ask anyone. Ask me.',
    seal: 'THE STONE IS UNDERWATER',
    reply: { who: 'aya', text: 'Enjoy the depths, Sour-don. The fish will be honest with you.' },
  },
  {
    who: 'don',
    text: 'I am leaving the Gulf. It is a terrible gulf. I am getting a better gulf, with a golf course, and lava. And no old men in towers. None at all. Not one.',
    seal: 'THE STONE HAS GONE VERY DARK',
  },
  {
    who: 'aya',
    text: 'Twenty battles, and the water still runs where it always ran. Rest now, friend. The tea is hot, the tower stands, and nobody passed.',
    seal: 'SEALED FROM THE TOP OF THE AYATOWER',
  },
];

/** In-game story beats: the Grey Turban speaks up at a wave start (or the boss), and Sour-don answers. */
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
  {
    level: 11,
    at: 'wave:4',
    aya: 'Plate and shadow together. The seeing-stone finds the Zumwalt; bolts and fire break it open.',
    don: 'They cannot see my ship. It is so stealthy, even I cannot see it. Where did it go?',
  },
  {
    level: 12,
    at: 'wave:5',
    aya: 'Fast hulls on a cushion of air. Slow them, and let the mines rise to meet them.',
    don: 'Hovercraft never stop. Mine do not even have brakes. That is a FEATURE.',
  },
  {
    level: 13,
    at: 'wave:6',
    aya: 'Invisible wings. A radar beside every AA pit, or they pass unseen.',
    don: 'Invisible AND expensive. The two best things a plane can be.',
  },
  {
    level: 14,
    at: 'wave:6',
    aya: 'The sky road fills. Let the flak burst among them; one shell, many jets.',
    don: 'Formation flying! Like a golf foursome. In the sky. Faster.',
  },
  {
    level: 15,
    at: 'boss',
    aya: 'The jumbo comes on the sky road, shedding bombers and jets. Only the sky towers can touch it now!',
    don: 'AIR FARCE ONE! Gold wings, gold engines, gold seatbelts. Fasten them. For me.',
  },
  {
    level: 16,
    at: 'wave:8',
    aya: 'Many small shadows under the marsh. The Ghadirs know this hunt; the mines know it too.',
    don: 'My submarine had submarines. It is like a family. A family of submarines.',
  },
  {
    level: 17,
    at: 'wave:7',
    aya: 'Little ground and three lanes. Our strength is in the water now; let the docks work.',
    don: 'He is standing in the sea. I said he would. Ducks everywhere. I am never wrong.',
  },
  {
    level: 18,
    at: 'wave:10',
    aya: 'At the crossings one tower reaches two lanes. Hold the crossings and the siege breaks.',
    don: 'Twice they cross! He is dizzy now. I can tell. I can always tell.',
  },
  {
    level: 19,
    at: 'wave:12',
    aya: 'The channel folds and folds again. Slow them at every fold; patience wins the long road.',
    don: 'Still sailing. Still winning. In my mind I have already won twice.',
  },
  {
    level: 20,
    at: 'boss',
    aya: 'There. Gold hotel, a pool, and the Eye on its tower. It must not dock. Everything we have, at the funnel!',
    don: 'WELCOME TO MORDOR-A-LAGO! Pool is open. Golf is open. Your tower is closed!',
  },
];
