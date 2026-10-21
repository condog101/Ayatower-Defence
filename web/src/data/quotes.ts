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
    'The Eye is OPEN. Wide open. The biggest Eye. Doctors say they have never seen an eye like it.',
    'My Nazgul admirals are ready. Nine of them. Very loyal. I fired the tenth.',
    'Today the Strait. Tomorrow a Barad-dur penthouse on Qeshm. Gold balconies. Lava views.',
    'An old man in a tower. Sad! My tower is taller. It has my NAME on it. In fire.',
  ]),
  ...q('aya', 'start', [
    'The Strait was old when his tower was a pile of unpaid invoices. To your posts.',
    'All we have to decide is what to do with the rials that are given to us.',
    'Another armada. Fill the samovar; this will take some waves.',
    'They come again. Very well. Piers upon the sand, iron in the shallows.',
  ]),

  // ---- wave start ----
  ...q('don', 'waveStart', [
    'SAIL, my precious fleet! Sail! Bigger! Shinier! With FLAGS!',
    'Release the orc-crews. Beautiful crews. I picked them myself. Mostly for their teeth.',
    'Another wave. A WINNING wave. I named it. Nobody names waves like me.',
    'Go, go, GO! First one through gets a steak from Mount Doom. Well done. Very well done.',
    'My Nazgul say wait. I say SAIL. Who is the Dark Lord here? Me. I checked.',
    'The Eye sees everything, old man. The Eye sees you. The Eye has excellent ratings.',
  ]),
  ...q('aya', 'waveStart', [
    'The board is set; the boats are moving. Mind the shallows.',
    'Here they come, in a perfectly straight line again. Bless them.',
    'Steady. A tower is never early, nor is it late. It fires precisely when it means to.',
  ]),

  // ---- leaks ----
  ...q('don', 'leak', [
    'ONE GOT THROUGH! Huge win. Historic. Carve it into the Black Gate.',
    'We are IN. A little bit in. A very big little bit.',
    'That one passed! You saw it. The Eye saw it. The Eye saw it twice.',
    'He said nothing shall pass. Something PASSED. Terrible wizard. Low energy.',
  ]),
  ...q('aya', 'leak', [
    'One slipped by. My patience is long, but it is not infinite. Unlike his speeches.',
    'A ship has passed. I said none shall pass. I was speaking aspirationally.',
    'That one cost us. Close the gap before the rest find it.',
  ]),

  // ---- low lives ----
  ...q('don', 'lowLives', [
    'The old man is SWEATING. I can see it from Mordor. I have a gift. The Eye gift.',
    'Almost there! His tower is wobbling. Cheap stone. Not like mine. Mine is volcanic.',
    'Push! He is out of patience. I never had any. That is my secret.',
  ]),
  ...q('aya', 'lowLives', [
    'My patience wears thin, like old parchment. Hold the line!',
    'If one more ship passes I shall have to say something very stern indeed.',
    'Do not despair. Despair is for those who see the end. I see a great many boats.',
  ]),

  // ---- bosses ----
  ...q('don', 'bossIntro', [
    'Make way for the BOSS. That is me. I am on the boat. I AM the boat. Bow before the boat.',
    'Behold! All gold. Even the anchor. It sank immediately. Beautiful.',
    'My personal vessel. Forged in the fires of Mount Doom. Also a shipyard in Florida.',
  ]),
  ...q('don', 'bossDead', [
    'That was NOT my boat. It was a decoy boat. I was never on it. I was in the Eye. Watching.',
    'FAKE gold! Forged by some other Dark Lord. A loser one. I have better gold in Mordor.',
    'Sunk? No. It is doing a submarine thing. Very advanced. Coming back up any minute.',
  ]),
  ...q('aya', 'bossDead', [
    'There goes the gold. The fish shall be very well decorated.',
    'The great vessel sinks. Let it be a lesson in buoyancy, if nothing else.',
    'So falls the golden boat. I would dance, but my knees are older than the Strait.',
  ]),

  // ---- level end ----
  ...q('don', 'clear', [
    'We LET him win that one. Strategy. Dark Lord strategy. You would not understand it.',
    'I am retreating FORWARD. Very brilliant. My Nazgul are taking notes.',
    'That was a practice Strait. Everybody knows. The next one counts double.',
  ]),
  ...q('aya', 'clear', [
    'The Strait holds. Now: chai, and a short nap beneath the dome.',
    'They have turned back. They always turn back. Then he tells everyone he won.',
    'Well held. Even the smallest speedboat can change the course of the future.',
  ]),
  ...q('don', 'defeat', [
    'I PASSED! Nobody thought I could pass. The Strait of Mordor-a-Lago is OPEN!',
    'He said I would not pass. I passed. Many times. Tremendous passing.',
    'Through! Construction starts Tuesday. A dark tower on every island. Gold doorknobs.',
  ]),
  ...q('aya', 'defeat', [
    'They passed. A wizard is allowed one bad day each age. Again, from the top.',
    'I have failed the Strait. Worse, he will tell the whole of Middle-earth. Loudly.',
    'Fall back, regroup, try another layout. Even I do not get it right first time.',
  ]),
  ...q('don', 'victory', [
    'The greatest retreat in history. They will teach it in Mordor. I founded the school.',
    'I did not lose. I won by leaving. Completely different. Ask my Nazgul.',
    'The Strait was BORING anyway. Wet. I am getting a much better strait. Volcanic.',
  ]),
  ...q('aya', 'victory', [
    'None passed. Well, some passed. But the important ones did not pass.',
    'It is over. Go home, Donald. Your hair is getting wet under that helmet.',
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
    'Very unfair staff. Illegal staff. I am putting the One Tariff on staffs.',
    'My ships are stopped. Not stopped. Pausing. Admiring the view. Beautiful sea.',
  ]),
  ...q('aya', 'fatwa', [
    'That one. Yes, that one. Everyone, that one.',
    'I have spoken a word of command over this vessel. It is now everybody\'s problem.',
    'A ruling: this ship sinks. Let it be written and swiftly carried out.',
  ]),
  ...q('don', 'fatwa', [
    'He put a FATWA on my BOAT! The boat is very upset. The boat is going to complain to the Eye.',
    'Unfair! That boat did nothing! It was just sailing at him, menacingly!',
    'They are all shooting at ONE boat. Bullying. Total bullying of a boat.',
  ]),

  // ---- teaching moments (first sighting) ----
  ...q('aya', 'firstAir', [
    'Wings over the water! Piers and mines cannot reach the sky. Only the AA bastion and the SAM tower can.',
    'Fell things fly above the lane. Raise an AA bastion near their path, or they come straight to my door.',
  ]),
  ...q('don', 'firstAir', [
    'My winged servants fly over his little boats. Only AA can touch them. Does he HAVE AA? Sad!',
  ]),
  ...q('aya', 'firstArmoured', [
    'Iron-plated hulls! Bullets bounce off. Rockets, mines, fire-boats and missiles will break them.',
    'Heavy plate. The machine guns only tickle it. Upgrade the pier to rockets, or bring explosives.',
  ]),
  ...q('don', 'firstArmoured', [
    'ARMOUR. Forged in Mordor. Your little bullets go ping, ping! Only big booms work. HA!',
  ]),
  ...q('aya', 'firstStealth', [
    'A hull wrapped in shadow. Towers cannot aim at what they cannot see: build a RADAR, or a GHADIR for subs.',
    'Something moves beneath. Mines still find it. A radar would let the rest find it too.',
  ]),
  ...q('don', 'firstStealth', [
    'Invisible! Like a ring, but a ship. Only RADAR sees it. And mines, but mines are cheating.',
  ]),

  // ---- misc ----
  ...q('don', 'speed3', [
    'FASTER! I love it. That is how I read reports from the Nazgul.',
    'Triple speed. Like a fell-beast with a deadline. Very fast. Very scary.',
    'Faster! Faster! Mount Doom closes at nine!',
  ]),
  ...q('don', 'idle', [
    'Hello? Old man? Did he fall asleep? He fell asleep in his tower. Low energy.',
    'Waiting. Always waiting. The Eye does not wait. The Eye has people who wait for it.',
    'Press the button, wizard. The START button. It is big. Even you can find it.',
  ]),
  ...q('aya', 'idle', [
    'Take your time. The Strait has waited ten thousand years. It can wait for you to finish your chai.',
  ]),
  ...q('don', 'random', [
    'Nobody knows more about straits than me. I have seen many straits. Some of the best straits.',
    'The sea is very big. Much bigger than people think. Even bigger than Mordor. Almost.',
    'My precious fleet has the most boats. Also the most beautiful boats. Also the most boats.',
    'One ring to rule them all? I have SEVEN rings. Gold. Very heavy. Hard to wave.',
    'The Eye never sleeps. It naps. Big difference. Very short naps. Power naps.',
    'I would like to thank the {damn} speedboats for absolutely nothing.',
    'They call me the Dark Lord. Dark? I am a very bright orange. Very bright!',
    'Mordor-a-Lago has the best volcano. Members only. Very exclusive lava.',
    'The One Tariff binds them all. I invented it. Everybody pays. Except me.',
    'My Nazgul ride fell-beasts. I ride a golf cart. Gold. With a little flag. An Eye flag.',
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
    'The pier of swift boats: small, fast and very loud, like my grandsons.',
    'A timber pier of fighting boats. When iron hulls come, give them rockets.',
  ]),
  ...q('don', 'tower:boats', ['Little boats. Adorable. Mine are bigger. Mine have a lava hot tub.']),
  ...q('aya', 'tower:mines', [
    'The mine-layer sows the water with iron seeds. Even the unseen trip on them.',
    'The seeds run out, so plant the layer close beside the lane.',
  ]),
  ...q('don', 'tower:mines', ['MINES? So rude. Nobody told me there would be mines. Very rude water.']),
  ...q('aya', 'tower:martyr', [
    'The black-sailed skiffs run up the lane and do not return. Neither does what they meet.',
    'Slow to make ready, but even iron plate fears their fire.',
  ]),
  ...q('don', 'tower:martyr', ['His boats sail AT my boats. That is not how boats work! Nobody sails at the Eye!']),
  ...q('aya', 'tower:aa_gun', [
    'The ballista bastion watches the sky. Ships are beneath its notice until the Mesbah.',
    'Iron bolts for winged things. Let them come low.',
  ]),
  ...q('don', 'tower:aa_gun', ['He is shooting at my flying things. They cost a fortune. I have the receipts. In Mordor.']),
  ...q('aya', 'tower:shahed', [
    'The roost of Shaheds: slow, loud and patient. They fly a long way to say hello.',
    'Homing wings with a long reach. Set the roost where the lane bends.',
  ]),
  ...q('don', 'tower:shahed', ['Flying lawnmowers! He fights the Eye with GARDEN EQUIPMENT. Low budget.']),
  ...q('aya', 'tower:jammer', [
    'In the tent a small orb hums. Their maps now insist they are somewhere near Ohio.',
    'It wounds no one, yet everything near it slows. Pair it with the guns.',
  ]),
  ...q('don', 'tower:jammer', ['My compass says we are at Mordor-a-Lago. Is this Mordor-a-Lago? I would like it to be.']),
  ...q('aya', 'tower:missile', [
    'The keep of the great bow. Costly, slow, and extremely persuasive.',
    'One bolt from the keep, one destroyer the less. Plate means nothing to it.',
  ]),
  ...q('don', 'tower:missile', ['Big bow. Not as big as mine. Mine is HUGE. Everybody says it is the biggest bow.']),
  ...q('aya', 'tower:radar', [
    'A seeing-stone of our own. Within its gaze, every tower can aim at what hides.',
    'Higher tiers lend reach and bite to the towers around it.',
  ]),
  ...q('don', 'tower:radar', ['He has a seeing-stone now? I am the Eye! That is MY thing! Total copying!']),
  ...q('aya', 'tower:ghadir', [
    'A little iron hull lies hidden in the reeds. It hears their submarines and strikes them twice as hard.',
    'Ghadir hunts beneath, and only from the shallows.',
  ]),
  ...q('don', 'tower:ghadir', ['A tiny submarine. Tiny! The size of my bathtub. I have a very big bathtub. Volcanic.']),
  ...q('aya', 'tower:sam', [
    'The twin-ballista tower keeps the long watch: great reach, sky only. Let the jets come.',
    'A true defence of the air at last. The hornets will think twice. Or once, briefly.',
  ]),
  ...q('don', 'tower:sam', ['Bolts that hit FLYING things? Unfair. Flying things are for flying. Sad!']),
  ...q('aya', 'tower:minaret', [
    'From the minaret a sermon on punctuality rings out. Every tower near it fires faster.',
    'Nothing stirs a gun crew like forty minutes of counsel at full volume.',
  ]),
  ...q('don', 'tower:minaret', ['He has a loud tower. I have a louder one. Mine screams. Ask the orcs.']),
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
