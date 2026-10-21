// The line bank. Two voices: BIG DON (a parody of Donald Trump, cast as Sauron, the Eye of
// Mordor-a-Lago) and THE AYATOWER (the Grey Turban: an Ayatollah caricature cast as Gandalf).
// Every line is fictional satire written for this game; none are real quotes, and the Tolkien
// nods are parodies, not quotations. Swear words are written as {word} and ALWAYS rendered
// bleeped (see renderLine); the censorship is part of the joke.
// In-game lines stay at or under 150 characters (tests/quotes.test.ts). Longer story copy lives in story.ts.

import type { TowerKey } from '../sim/types';

export type Who = 'don' | 'aya';

export type QuoteTag =
  | 'start'
  | 'waveStart'
  | 'leak'
  | 'lowLives'
  | 'bossIntro'
  | 'bossDead'
  | 'clear'
  | 'defeat'
  | 'victory'
  | 'staff'
  | 'fatwa'
  | 'firstAir'
  | 'firstArmoured'
  | 'firstStealth'
  | 'speed3'
  | 'idle'
  | 'random'
  | `tower:${TowerKey}`;

/** Tags both voices speak to (tests require lines from each). */
export const TWO_VOICE_TAGS: QuoteTag[] = [
  'start', 'leak', 'lowLives', 'bossDead', 'clear', 'defeat', 'victory', 'staff', 'fatwa', 'firstAir', 'firstArmoured', 'firstStealth', 'random',
];

export interface Quote {
  who: Who;
  text: string;
  tags: QuoteTag[];
}

const q = (who: Who, tag: QuoteTag, lines: string[]): Quote[] => lines.map((text) => ({ who, text, tags: [tag] }));

export const QUOTES: Quote[] = [
  // ---- level start ----
  ...q('don', 'start', [
    'The Strait of DON is open. I opened it. Very beautiful opening. Many people cried.',
    'My ships are the best ships. Everybody says so. Admirals come up to me, tears in their eyes.',
    'Today we sail. Tomorrow, a hotel on Qeshm. Gold. Very tasteful. Thank you for your attention to this matter!',
    'Old man in a tower. Very sad. I have MANY towers. Mine have my NAME on them.',
  ]),
  ...q('aya', 'start', [
    'The Strait is older than your yacht, Donald. Older than your hair, even the parts that are real.',
    'All we have to decide is what to do with the rials that are given to us.',
    'Another day, another armada. Put the kettle on. This may take ten waves.',
    'They come again. Very well. Speedboats to the sand, mines to the shallows.',
  ]),

  // ---- wave start ----
  ...q('don', 'waveStart', [
    'SEND THE NEXT ONES. Bigger! Shinier! With FLAGS!',
    'Here they come. Tremendous ships. I picked them myself from a catalogue.',
    'Another wave. They call it a wave because it is a WINNING WAVE. I named it.',
    'Go, go, GO! First one through gets a steak. Well done. With ketchup.',
    'My admirals say wait. I say SAIL. Who is the admiral? Me. I am the admiral.',
    'The Eye sees everything. The Eye sees you, old man. The Eye has excellent ratings.',
  ]),
  ...q('aya', 'waveStart', [
    'The board is set. The boats are moving. Mind the shallows.',
    'Here they come, sailing in a perfectly straight line again. Bless them.',
    'Steady. A tower is never early, nor is it late. It fires precisely when it means to.',
  ]),

  // ---- leaks ----
  ...q('don', 'leak', [
    'ONE GOT THROUGH! Huge win. Historic. Put it on a hat.',
    'We are IN. Slightly. A little bit in. Very big little bit.',
    'That one passed. You saw it. Everybody saw it. The Eye saw it twice.',
    'He said nothing shall pass. Something passed! He is a LIAR wizard!',
  ]),
  ...q('aya', 'leak', [
    'One slipped by. My patience is long, but it is not infinite. Unlike his posts.',
    'A boat has passed. I said none shall pass. I was speaking aspirationally.',
    'That one cost us. Fill the gap before the rest find it.',
  ]),

  // ---- low lives ----
  ...q('don', 'lowLives', [
    'The old man is SWEATING. I can tell. I have a gift for sweat.',
    'Almost there! His tower is wobbling. Cheap tower. Not like mine.',
    'Keep pushing! He is out of patience. I never had any. That is my secret.',
  ]),
  ...q('aya', 'lowLives', [
    'My patience wears thin, like parchment. Or like his excuses. Hold the line!',
    'If one more ship passes I shall have to say something very stern.',
    'Do not despair. Despair is for those who see the end. I see a lot of boats.',
  ]),

  // ---- bosses ----
  ...q('don', 'bossIntro', [
    'Make way for the BOSS. That is me. I am the boss. I am on the boat. I AM the boat.',
    'Here she comes. Gold. All gold. Even the anchor. It sank immediately. Beautiful.',
    'This is my personal vessel. Very big. The biggest. The ocean asked for my autograph.',
  ]),
  ...q('don', 'bossDead', [
    'That was NOT my boat. That was a decoy boat. I was never on it. Very smart.',
    'The gold was FAKE gold. Made in another country. I have better gold at home.',
    'Sunk? No. It is doing a submarine thing. Very advanced. Coming back up any minute.',
  ]),
  ...q('aya', 'bossDead', [
    'There goes the gold. The fish shall be very well decorated.',
    'The great vessel sinks. Let it be a lesson in buoyancy, if nothing else.',
    'So falls the golden boat. I would gloat, but my knees are too old for dancing.',
  ]),

  // ---- level end ----
  ...q('don', 'clear', [
    'We LET him win that one. Strategy. Big strategy. You would not understand it.',
    'I am retreating FORWARD. Very brilliant. Generals study it.',
    'That was a practice level. Everybody knows. Next one counts. Double.',
  ]),
  ...q('aya', 'clear', [
    'The Strait holds. Now: tea, and perhaps a short nap in the minaret.',
    'They have turned back. They always turn back. Then they post about it.',
    'Well held. Even the smallest speedboat can change the course of the future.',
  ]),
  ...q('don', 'defeat', [
    'I PASSED! Nobody thought I could pass. The Strait of DON is OPEN for business!',
    'The old man said I would not pass. I passed. Many times. Big passing.',
    'Through! Hotel construction begins Tuesday. Gold toilets on every island.',
  ]),
  ...q('aya', 'defeat', [
    'They passed. A wizard is allowed one bad day per millennium. Again, from the top.',
    'I have failed the Strait. Worse, he will post about it. In capitals.',
    'Fall back, regroup, try another layout. Even I do not get it right first time.',
  ]),
  ...q('don', 'victory', [
    'The greatest retreat in history. They will teach it at retreat school. I founded it.',
    'I did not lose. I won by leaving. Very different. Ask my lawyers.',
    'The Strait was BORING anyway. I am buying a different strait. A nicer one.',
  ]),
  ...q('aya', 'victory', [
    'None passed. Well, some passed. But the important ones did not pass.',
    'It is over. Go home, Donald. Your hair is getting wet.',
    'The Eye closes. Now, where did I leave my tea?',
  ]),

  // ---- abilities ----
  ...q('aya', 'staff', [
    'YOU SHAH-LL NOT PASS!',
    'Back to the shadow! Or at least back to international waters!',
    'I am a servant of the Strait! Your engines will not avail you!',
  ]),
  ...q('don', 'staff', [
    'He hit the SEA with a STICK! Is that allowed? Somebody check if that is allowed!',
    'Very unfair staff. Illegal staff. I am sanctioning the staff.',
    'My ships are stopped. Not stopped. Pausing. Admiring the view. Beautiful sea.',
  ]),
  ...q('aya', 'fatwa', [
    'That one. Yes, that one. Everyone, that one.',
    'A FATWA upon this vessel. It is now everybody\'s problem.',
    'I have issued a stern ruling. The ruling is: sink it.',
  ]),
  ...q('don', 'fatwa', [
    'He put a FATWA on my BOAT! The boat is very upset. The boat is going to sue.',
    'Unfair! That boat did nothing! It was just sailing at him, menacingly!',
    'They are all shooting at ONE boat. Bullying. Total bullying of a boat.',
  ]),

  // ---- teaching moments (first sighting) ----
  ...q('aya', 'firstAir', [
    'Aircraft! The boats and mines cannot reach the sky. Only the AA PIT and the SAM SITE can.',
    'Wings over the water. Build an AA PIT near the lane, or they fly straight to my door.',
  ]),
  ...q('don', 'firstAir', [
    'PLANES! Your boats cannot hit planes, old man. Only AA guns. Do you HAVE AA guns? Sad!',
  ]),
  ...q('aya', 'firstArmoured', [
    'Armour! Bullets bounce off. Rockets, mines, drone boats and missiles will crack it.',
    'Heavy steel. The machine guns tickle it. Upgrade the pier to rockets, or bring explosives.',
  ]),
  ...q('don', 'firstArmoured', [
    'ARMOUR. Very thick. Your little bullets just bounce off. Ping! Ping! Only big booms work. HA!',
  ]),
  ...q('aya', 'firstStealth', [
    'A hidden hull. Towers cannot aim at what they cannot see: build a RADAR, or a GHADIR sub for subs.',
    'Something sails beneath. Mines still find it. A radar would let the rest find it too.',
  ]),
  ...q('don', 'firstStealth', [
    'STEALTH! You cannot see it! Only radar sees it. And mines, but mines are cheating.',
  ]),

  // ---- misc ----
  ...q('don', 'speed3', [
    'FAST FORWARD! I love it. That is how I read briefings.',
    'Triple speed. Like my metabolism. Very fast. Doctors are amazed.',
    'Faster! Faster! I have a tee time!',
  ]),
  ...q('don', 'idle', [
    'Hello? Old man? Did he fall asleep? He fell asleep in his tower. Low energy.',
    'Waiting. Always waiting. I do not wait. I have people who wait for me.',
    'Press the button, wizard. The START button. It is big. Even you can find it.',
  ]),
  ...q('aya', 'idle', [
    'Take your time. The Strait has waited ten thousand years. It can wait for you to finish your tea.',
  ]),
  ...q('don', 'random', [
    'Nobody knows more about straits than me. I have seen many straits. Some of the best straits.',
    'The ocean is very big. Much bigger than people think. I was surprised.',
    'My Navy has the most boats. Also the most beautiful boats. Also the most boats.',
    'Fake news says I am losing. I am WINNING, slowly, in the wrong direction.',
    'That old man has a STAFF. I have a STAFF too. Four hundred people. They do whatever I say.',
    'One ring to rule them all? I have SEVEN rings. Gold. Very heavy. Hard to type.',
    'The Eye never sleeps. It naps. Big difference. Very short naps. Power naps.',
    'I would like to thank the {damn} speedboats for nothing. Thank you for your attention to this matter!',
    'They call me the Dark Lord. Dark? I am a very bright orange. Very bright!',
    'Mordor-a-Lago has the best volcano. Members only. Very exclusive lava.',
  ]),
  ...q('aya', 'random', [
    'Fly, you fools! No, not you. You are boats. Sail, you fools.',
    'Do not take me for some conjurer of cheap tricks. My tricks are sanctioned, and therefore expensive.',
    'I was there when the Strait was young. It was mostly the same. Wetter, perhaps.',
    'A turban is never late, nor is it early. It arrives precisely when it means to.',
    'He has seven rings, I hear. I have one. It is for my keys.',
    'Keep the rials secret. Keep them safe. And spend them on mines.',
  ]),

  // ---- first build of each tower ----
  ...q('aya', 'tower:boats', [
    'The speedboats! Small, fast, very loud. Like my grandsons.',
    'A pier of fast boats. Upgrade them to rockets when the armour comes.',
  ]),
  ...q('don', 'tower:boats', ['Little boats. Adorable. Mine are bigger. Mine have hot tubs.']),
  ...q('aya', 'tower:mines', [
    'Mines in the shallows. They ask no questions and they never miss a submarine.',
    'Mines run out, so keep the layer close to the lane.',
  ]),
  ...q('don', 'tower:mines', ['MINES? That is so rude. Nobody told me there would be mines. Very rude ocean.']),
  ...q('aya', 'tower:martyr', [
    'The drone boats go up the lane and do not come back. Neither does whatever they meet.',
    'Slow to reload, but even armour fears that blast.',
  ]),
  ...q('don', 'tower:martyr', ['His boats are driving AT my boats. That is not how boats work! Nobody drives at me!']),
  ...q('aya', 'tower:aa_gun', [
    'The AA pit. It cannot touch a hull until the Mesbah upgrade, but the sky is its business.',
    'Twin cannons pointed up. Let the drones come.',
  ]),
  ...q('don', 'tower:aa_gun', ['He is shooting at my DRONES. Those drones are worth a fortune. I have the receipts. Somewhere.']),
  ...q('aya', 'tower:shahed', [
    'Shaheds: slow, loud, patient. They fly a long way to say hello.',
    'Homing drones with a long reach. Put them where the lane bends.',
  ]),
  ...q('don', 'tower:shahed', ['Flying lawnmowers! He is attacking me with GARDEN EQUIPMENT. Low budget.']),
  ...q('aya', 'tower:jammer', [
    'The jammer whispers false directions. Their satnav now insists they are in Ohio.',
    'It does no harm, but everything near it slows. Pair it with the guns.',
  ]),
  ...q('don', 'tower:jammer', ['My GPS says we are at a golf course. Is this a golf course? I would like it to be.']),
  ...q('aya', 'tower:missile', [
    'Coastal missiles. Expensive, slow, and extremely persuasive.',
    'One missile, one destroyer. Armour means nothing to it.',
  ]),
  ...q('don', 'tower:missile', ['Big missile. Not as big as mine. Mine is HUGE. Everybody says it is the biggest.']),
  ...q('aya', 'tower:radar', [
    'The radar sees what hides. With it, every tower nearby can aim at the stealthy ones.',
    'An eye of our own. Better upgrades lend range and bite to its neighbours.',
  ]),
  ...q('don', 'tower:radar', ['He has an EYE now? I am the Eye! Copyright infringement! I am calling my lawyers!']),
  ...q('aya', 'tower:ghadir', [
    'A little submarine in the shallows. It hears their subs and hits them twice as hard.',
    'Ghadir hunts beneath. Only in the shallows, mind.',
  ]),
  ...q('don', 'tower:ghadir', ['A tiny submarine. Tiny! It is the size of my bathtub. I have a very big bathtub.']),
  ...q('aya', 'tower:sam', [
    'The Bavar stands watch. Long reach, air only. Let the jets come.',
    'A proper air defence at last. The hornets will think twice. Or once, briefly.',
  ]),
  ...q('don', 'tower:sam', ['Missiles that hit PLANES? Unfair. Planes are for flying, not for hitting. Sad!']),
  ...q('aya', 'tower:minaret', [
    'The loudspeakers carry a sermon on punctuality. Everything nearby fires faster.',
    'Nothing motivates a gun crew like a forty-minute sermon at full volume.',
  ]),
  ...q('don', 'tower:minaret', ['He has a LOUDSPEAKER. I have a phone. My phone is louder. Ask anyone. 3 AM!']),
];

/** Pick a line for `tag`, avoiding anything in `recent`; optionally only one speaker's. Returns the RAW text. */
export function pickQuote(tag: QuoteTag, recent: string[], who?: Who): Quote | null {
  const all = QUOTES.filter((t) => t.tags.includes(tag) && (!who || t.who === who));
  if (all.length === 0) return null;
  const fresh = all.filter((t) => !recent.includes(t.text));
  const pool = fresh.length ? fresh : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Render a raw line for display: every {word} becomes a run of asterisks the same length. */
export function renderLine(text: string): string {
  return text.replace(/\{([^}]*)\}/g, (_, w: string) => '*'.repeat(w.length));
}

/** True when the rendered character at `i` is part of a bleeped word. Lines never otherwise contain '*'. */
export function isBleeped(rendered: string, i: number): boolean {
  return rendered[i] === '*';
}
