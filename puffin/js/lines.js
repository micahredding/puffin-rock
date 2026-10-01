// Everything anybody on Puffin Rock says, in one place.
//
// The NARRATOR is the show's: warm, slow, a gentle Irish voice that tells you
// what the puffins are doing and then, now and then, something true about
// real puffins — as if it were the most interesting thing in the world, which
// to a four year old it is. The friends speak for themselves, a line or two
// each. Every line is short enough to be over before he has tapped again.
//
// Each line is recorded once by tools/narrate.mjs into voice/<id>.mp3, and
// the recording remembers the words it was made from: CHANGE A LINE'S TEXT and
// the old clip stops being played (the browser's own voice reads the new words)
// until it is recorded again. So this file can be edited freely.
//
// The facts are real ones, and checked: puffins nest in burrows, often reused
// year after year; they beat their wings up to 400 times a minute; they can
// carry a dozen or more small fish crosswise in the beak; they dive using their
// wings to swim; a puffin chick is a "puffling"; their beaks are brightest in
// spring and summer; rabbits share puffin islands and puffins sometimes nest
// in old rabbit burrows.

import { talkLines } from './talks.js';

export const LINES = {
  // Arriving.
  'hello':        { who: 'narrator', text: 'This is Puffin Rock. And this is Oona, and her little brother, Baba.' },
  'hello-again':  { who: 'narrator', text: 'Good morning, Puffin Rock! Oona and Baba are ready for an adventure.' },

  // Home.
  'burrow-in':    { who: 'narrator', text: 'Puffins live in burrows. A burrow is a cosy hole in the ground, dug with beaks and feet.' },
  'burrow-in-2':  { who: 'narrator', text: 'Back inside the burrow. Nice and snug.' },
  'burrow-fact':  { who: 'narrator', text: 'Puffins often come back to the very same burrow, year after year.' },
  'burrow-out':   { who: 'narrator', text: 'And out they pop!' },
  'mama-1':       { who: 'mama', text: 'Hello, my little puffins!' },
  'mama-2':       { who: 'mama', text: 'Stay close to Baba, Oona. He is only little.' },
  'mama-3':       { who: 'mama', text: 'Have you been to see the dandelions?' },
  'papa-1':       { who: 'papa', text: 'Off you go exploring, you two!' },
  'papa-2':       { who: 'papa', text: 'Watch me flap! Puffins can flap their wings four hundred times a minute!' },
  'papa-3':       { who: 'papa', text: 'I hear Mossy has found something fun up on the rocks.' },

  // Flying.
  'flap':         { who: 'narrator', text: 'Flap, flap, flap! Puffins beat their wings very, very fast.' },
  'baba-wait':    { who: 'baba', text: 'Oona! Wait for me!' },
  'baba-fly':     { who: 'narrator', text: "Baba can't fly yet. He's a puffling: a baby puffin. So he waddles instead." },

  // The meadow.
  'dandelion-hint': { who: 'narrator', text: 'Dandelion clocks! Blow on them, and see what happens.' },
  'count-1':      { who: 'narrator', text: 'One!' },
  'count-2':      { who: 'narrator', text: 'Two!' },
  'count-3':      { who: 'narrator', text: 'Three!' },
  'count-4':      { who: 'narrator', text: 'Four!' },
  'count-5':      { who: 'narrator', text: 'Five!' },
  'count-6':      { who: 'narrator', text: 'Six!' },
  'count-7':      { who: 'narrator', text: 'Seven!' },
  'count-8':      { who: 'narrator', text: 'Eight!' },
  'count-9':      { who: 'narrator', text: 'Nine!' },
  'count-10':     { who: 'narrator', text: 'Ten!' },
  'dandelions-all': { who: 'narrator', text: 'Five dandelion clocks! The wind carries their seeds far, far away, and where they land, new dandelions grow.' },
  'dandelions-back': { who: 'narrator', text: 'Look! The dandelion clocks are back.' },
  'may-1':        { who: 'may', text: 'Hello, Oona! Hello, Baba! Watch me hop!' },
  'may-2':        { who: 'narrator', text: 'May the rabbit lives in a burrow too, just like the puffins.' },
  'may-3':        { who: 'may', text: 'Hop, hop, hop! Can you hop like me?' },

  // The rocks and the slide.
  'mossy-hello':  { who: 'mossy', text: 'Oona! Baba! Look what I found! Wheeee!' },
  'mossy-1':      { who: 'mossy', text: "Hello, Oona! It's me, Mossy!" },
  'mossy-2':      { who: 'mossy', text: 'Sit in the eggshell, and down you go!' },
  'mossy-3':      { who: 'narrator', text: 'Mossy is a pygmy shrew. One of the smallest animals on Puffin Rock.' },
  'egg-hint':     { who: 'narrator', text: 'A piece of eggshell. Just the right size for sliding.' },
  'whee':         { who: 'oona', text: 'Wheeeeeeeeee!' },
  'slide-1':      { who: 'narrator', text: 'They all slide down the slope!' },
  'slide-2':      { who: 'oona', text: 'Again! Again!' },
  'slide-3':      { who: 'narrator', text: 'Round and round they go. Up the rocks, and down the slide.' },

  // The sea, for now just to look at.
  'sea':          { who: 'narrator', text: 'The sea! Puffins dive under the waves, using their wings to swim, to catch little silver fish.' },
  'sea-fact':     { who: 'narrator', text: 'A puffin can carry a whole row of fish in its beak, all at once.' },

  // Swimming. Real puffins float high and dry on the sea, paddle with their
  // feet, and dive by beating their wings under the water — "flying" there.
  'swim':         { who: 'narrator', text: 'Splash! Puffins float on the sea like little boats, paddling with their orange feet.' },
  'dive':         { who: 'narrator', text: 'Down she dives! Under the water, puffins swim with their wings, as if they were flying.' },
  'surface':      { who: 'oona', text: 'Look, Baba! I can swim like Papa!' },
  'deep':         { who: 'narrator', text: 'Down, down, down, all the way to the bottom of the sea.' },
  'baba-float':   { who: 'narrator', text: "Baba can float too. He's too little to dive, not yet. So he bobs along on top." },

  // Fishing, and feeding Baba. Real puffins hold their catch crosswise in
  // the beak, pinned by a rough tongue, and can carry ten or more at once;
  // the parents fly out again and again to feed their puffling.
  'fish-first':   { who: 'narrator', text: 'A fish! Puffins carry the fish they catch crosswise in their beaks, like this.' },
  'fish-full':    { who: 'narrator', text: "Ten fish! Oona's beak is full." },
  'baba-hungry':  { who: 'baba', text: "Oona! I'm hungry!" },
  'fish-hint':    { who: 'narrator', text: "Baba is hungry. Maybe Oona can catch him some fish from the sea." },
  'fed':          { who: 'narrator', text: 'Yum! Puffin mums and dads fly out to sea again and again, to bring their pufflings fish.' },
  'baba-thanks':  { who: 'baba', text: 'Thank you, Oona! More fish, please!' },

  // The Mossy Wood.
  'wood':         { who: 'narrator', text: 'This is the Mossy Wood. It is shady, and quiet, and everything is soft and green.' },
  'wood-fact':    { who: 'narrator', text: 'Moss grows where it is damp and shady. It is soft and springy, like a cushion.' },
  'mushroom-hint': { who: 'narrator', text: 'Some of these mushrooms glow. Touch one, and see.' },
  'mushrooms-all': { who: 'narrator', text: 'Five glowing mushrooms! Now the whole wood is lit up.' },

  // West: the pond and the seabird cliffs.
  'pond':         { who: 'narrator', text: 'The pond! Look at the lily pads. The frog is bouncing on them.' },
  'boing':        { who: 'narrator', text: 'Boing! The lily pads are bouncy!' },
  'frog':         { who: 'narrator', text: 'Ribbit! Frogs love lily pads. They sit on them in the sun, and wait for flies.' },
  'cliffs':       { who: 'narrator', text: 'The seabird cliffs. Gannets and kittiwakes make their nests on the ledges, high above the sea.' },
  'wind':         { who: 'narrator', text: 'Whoosh! The wind blows up the cliff, and lifts Oona up, up, up, just like the seabirds.' },

  'marvin-hello': { who: 'marvin', text: "Oh! Hello, Oona. I'm Marvin. Watch my big splash!" },
  'marvin-fact':  { who: 'narrator', text: 'Otters love to play in the water. Fly up high over the pond, and let go, to splash like Marvin!' },
  'cannonball':   { who: 'oona', text: 'Cannonball! Splash!' },
  'cannonball-2': { who: 'marvin', text: "Wow, Oona! That was an even bigger splash than mine!" },
  'bridge':       { who: 'narrator', text: 'An old stone bridge, all covered in soft green moss.' },

  // The grassland's friends.
  'sheep':        { who: 'narrator', text: 'Baa! A mammy sheep and her little lamb, munching the sweet grass.' },

  // The beach: Bernie, and his shells.
  'bernie-1':     { who: 'bernie', text: 'Hello, Oona! This shell is much too big for me.' },
  'bernie-2':     { who: 'bernie', text: "Hmm. Now this one's too small!" },
  'bernie-3':     { who: 'bernie', text: 'Ah! This one is just right!' },
  'bernie-fact':  { who: 'narrator', text: "Hermit crabs don't grow shells of their own. They borrow empty ones, and move into bigger ones as they grow." },

  // Out at sea.
  'kelp':         { who: 'narrator', text: 'A kelp forest! Kelp is a seaweed that grows tall and wavy, like trees under the sea.' },
  'jelly':        { who: 'narrator', text: "Moon jellies, drifting along with the sea. Look, but don't touch. They can sting!" },
  'whale':        { who: 'narrator', text: 'Look, far out to sea! A whale, coming up to breathe. Whoosh!' },

  // East: Silky's rock and the rocky shore.
  'silky-see':    { who: 'narrator', text: "Look! It's Silky the seal, resting on her rock." },
  'silky-hello':  { who: 'silky', text: 'Hello, Oona! Hop on my back, and hold on tight!' },
  'silky-fact':   { who: 'narrator', text: 'Seals are wonderful swimmers. Silky can stay under the water for a long, long time.' },
  'silky-again':  { who: 'silky', text: 'That was fun! Come back any time, Oona.' },
  'shore':        { who: 'narrator', text: 'The rocky shore. Look in the rock pools: all sorts of creatures live in them.' },
  'crab':         { who: 'narrator', text: 'A crab! Crabs walk sideways. Scuttle, scuttle, scuttle!' },
  'anemone':      { who: 'narrator', text: 'A sea anemone. Touch it gently, and it closes up tight.' },
  'blowhole-hint': { who: 'narrator', text: "Whoosh! That's a blowhole. The waves push the water up through a hole in the rock." },
  'blowhole':     { who: 'oona', text: 'Wheeeeee! Again!' },

  // Under Puffin Rock: the tunnels.
  'tunnels':      { who: 'narrator', text: 'And look: tunnels, winding all the way under Puffin Rock!' },
  'nest':         { who: 'narrator', text: 'The nest, lined with soft dry grass and feathers. Time for a little nap.' },
  'wake':         { who: 'oona', text: "Wake up, Baba! Let's explore!" },
  'hedgehog':     { who: 'narrator', text: 'Shh! A hedgehog, fast asleep. Hedgehogs sleep all day, and wake up at night to look for beetles and worms.' },
  'hedgehog-2':   { who: 'narrator', text: 'Sniff, sniff. He curls up into a prickly ball!' },
  'worm':         { who: 'narrator', text: 'A worm! Worms dig tiny tunnels of their own, and keep the soil soft and healthy.' },
  'branches':     { who: 'narrator', text: 'The tunnels go every which way! One goes up, and one goes down, down, down.' },
  'pantry':       { who: 'narrator', text: 'A little larder, full of seeds and nuts and berries. Whose could it be?' },
  'peekaboo':     { who: 'oona', text: 'Peekaboo! I see you!' },
  'mouse':        { who: 'narrator', text: 'A wood mouse! Mice store seeds and nuts underground, to eat in the winter.' },
  'cave':         { who: 'narrator', text: 'A deep, dark cave. Look at the mushrooms, and all those silvery threads.' },
  'fungi':        { who: 'narrator', text: 'Fungi grow long threads under the ground, joining the roots of the plants together, like a secret web.' },
  'glow':         { who: 'oona', text: 'Ooh! The light goes all the way along!' },
  'climb':        { who: 'oona', text: 'Up, up, up the roots! Come on, Baba!' },
  'warren':       { who: 'may', text: 'Hello, Oona! You climbed up into our warren! Meet my brothers and sisters!' },
  'rabbits-fact': { who: 'narrator', text: 'Puffins sometimes make their homes in old rabbit burrows. So puffins and rabbits can be neighbours, underground!' },

  // Past the rocky shore: the dunes, the bog, the waterfall.
  'dunes':        { who: 'narrator', text: 'The sand dunes! Marram grass holds all the sand together, with its long, long roots.' },
  'dig-hint':     { who: 'narrator', text: 'Something is hidden in the sand. Dig, and see what you find!' },
  'dig-glass':    { who: 'oona', text: 'Sea glass! Smooth and shiny, like a jewel!' },
  'dig-scallop':  { who: 'oona', text: 'A scallop shell! It looks like a little fan.' },
  'dig-purse':    { who: 'narrator', text: "A mermaid's purse! It's really an egg case. A baby dogfish grew inside it, and swam away." },
  'dig-all':      { who: 'narrator', text: 'Three treasures from the sand! What a lucky puffin.' },
  'bog':          { who: 'narrator', text: 'A boggy place. The ground is soft and squelchy, and white bog cotton nods in the breeze.' },
  'dragonfly':    { who: 'narrator', text: 'Dragonflies! They can fly forwards, and backwards, and even stop still in the air.' },
  'falls':        { who: 'narrator', text: 'A waterfall! The water tumbles down the rocks, splish, splash, into the pool.' },
  'shower':       { who: 'oona', text: "It's a shower! Brrr! Splashy!" },
  'rainbow':      { who: 'narrator', text: 'Look! A rainbow! When the sun shines through the spray, it makes all the colours.' },

  // Day and night.
  'night':        { who: 'narrator', text: 'Night time on Puffin Rock. Look at all the stars!' },
  'morning':      { who: 'narrator', text: 'Good morning, Puffin Rock! A brand new day.' },
  'fireflies':    { who: 'narrator', text: 'Fireflies! They make their own little lights, blinking on and off.' },
  'bedtime':      { who: 'mama', text: "It's bedtime, my little puffins. In you come!" },
  'goodnight':    { who: 'narrator', text: 'Goodnight, Oona. Goodnight, Baba. Sweet dreams.' },
  'plankton':     { who: 'narrator', text: 'Look! At night, tiny creatures in the sea glow, wherever Oona swims.' },
  'hedgehog-night': { who: 'narrator', text: 'The hedgehog is awake! Hedgehogs come out at night, to find their supper.' },
  'sun-down':     { who: 'oona', text: 'Goodnight, sun!' },
  'sun-up':       { who: 'oona', text: 'Good morning, sun!' },

  // Flying with Papa.
  'papa-fly':     { who: 'papa', text: 'Follow me, Oona! Up, up we go!' },
  'papa-fly-fact': { who: 'narrator', text: 'Puffins fly fast and low, flapping their wings all the way.' },
  'papa-fly-end': { who: 'papa', text: "Well done, Oona! You're a real flyer now!" },

  // Staying still.
  'still-shh':    { who: 'narrator', text: 'Shh. If Oona stays very, very still...' },
  'butterfly':    { who: 'narrator', text: "A butterfly! It's landed right on Oona's head!" },
  'bee':          { who: 'narrator', text: 'And a bumblebee! Bumblebees visit the flowers, and help them make their seeds.' },
  'flyaway':      { who: 'oona', text: 'Oh! Bye bye!' },

  // Rain.
  'rain':         { who: 'narrator', text: "Pitter, patter. It's raining on Puffin Rock!" },
  'rain-fact':    { who: 'narrator', text: "Puffins don't mind the rain. Their feathers are waterproof!" },
  'puddle':       { who: 'oona', text: 'Splish! Splash! Puddles are for jumping in!' },

  // Hide and seek.
  'hide-start':   { who: 'baba', text: "Let's play hide and seek! You count, Oona!" },
  'hide-ready':   { who: 'oona', text: 'Ready or not, here I come!' },
  'hide-hint':    { who: 'narrator', text: 'Listen! Can you hear Baba giggling?' },
  'hide-found':   { who: 'baba', text: 'You found me! Again, again!' },

  // Little things to find.
  'oona-1':       { who: 'oona', text: 'Hello!' },
  'oona-2':       { who: 'oona', text: "I'm Oona!" },
  'oona-3':       { who: 'oona', text: 'Where shall we go next, Baba?' },
  'hello-echo':   { who: 'oona', text: 'Hellooo!' },
  'neighbours':   { who: 'narrator', text: 'The neighbours are popping out to say hello!' },
  'footprints':   { who: 'narrator', text: 'Footprints in the sand! The waves will wash them away.' },
  'frog-fly':     { who: 'narrator', text: 'Slurp! The frog caught a fly, with its long, sticky tongue.' },
  'bunny':        { who: 'narrator', text: 'A bunny! Rabbits dig lots of holes, all joined up under the ground.' },
  'mouse-nibble': { who: 'narrator', text: 'The mouse is having a little snack. Nibble, nibble.' },
  'pup':          { who: 'narrator', text: "Silky's pup! A baby seal is called a pup." },

  // When nothing has happened for a while.
  'hint':         { who: 'narrator', text: 'I wonder what Oona will find over there?' },
};

// The sit-down conversations' lines (talks.js), recorded like the rest.
Object.assign(LINES, talkLines());

export const COUNT = (n) => `count-${n}`;

// The friends take turns through their lines; say `cycle('mama', n)` for the
// nth time Mama is tapped.
export function cycle(prefix, n) {
  const ids = Object.keys(LINES).filter((k) => k.startsWith(`${prefix}-`) && /-\d+$/.test(k));
  return ids[n % ids.length];
}
