// THE CONVERSATIONS: a sit-down with each friend, somewhere a little off the
// path — in a hollow log, on the bridge, up on the rocks, in the nest — where
// the pace slows and they really talk. The show's way: warm, curious, a true
// thing about the animals said as if it were the most interesting thing in
// the world, and nobody ever in a hurry.
//
// A script is a little graph. Each node is a line ({ who, text, next }) or a
// CHOICE ({ choices: [{ thing, text, next }] }): two THINGS pop up in the
// nook — a clover patch, a beetle, a starfish (talk.js draws them) — and
// whichever he taps, Oona says something about it, and the conversation goes
// that way. No words to read: the world itself is the menu. (`sky: true`
// puts the thing up in the air: a cloud, the moon, a feather.) A node with no
// `next` ends it. `nap: true` on the ending sends them to sleep (Mama's).
//
// Every line is recorded like any other (tools/narrate.mjs): talkLines() gives
// the ids — `talk-<friend>-<node>` for a line, `talk-<friend>-<node>-<n>` for
// the n-th thing Oona can choose to say — and lines.js takes them in.

export const TALKS = {
  may: {
    friend: 'may', nook: 'log', start: 'a',
    nodes: {
      a: { who: 'may', text: 'Oh, hello, Oona! Come in, come in. This old log is my favourite hiding place.', next: 'b' },
      b: { who: 'oona', text: "It's so cosy in here!", next: 'c' },
      c: { who: 'may', text: 'When it rains, I sit in here and listen to the drops go pitter, patter on the roof.', next: 'd' },
      d: { choices: [
        { thing: 'clover', text: 'Ooh, clover! Is that your favourite food, May?', next: 'e1' },
        { thing: 'hole', text: 'Is that your burrow? How many brothers and sisters live in there?', next: 'f1' },
      ] },
      e1: { who: 'may', text: 'Clover! Sweet, juicy clover. And dandelion leaves. Nibble, nibble, nibble, all day long.', next: 'e2' },
      e2: { who: 'narrator', text: "Rabbits' teeth never stop growing. So they have to keep on chewing!", next: 'g' },
      f1: { who: 'may', text: 'Oh, lots and lots! Too many to count! We all live together, in our warren.', next: 'f2' },
      f2: { who: 'oona', text: "Baba's my only brother. But sometimes he feels like lots!", next: 'f3' },
      f3: { who: 'may', text: 'Ha ha! Little brothers are like that.', next: 'g' },
      g: { choices: [
        { thing: 'stump', text: 'Can you teach me to hop, all the way up onto that stump?', next: 'h1' },
        { thing: 'moon', sky: true, text: "Look, the moon's out already. What do you do at night, May?", next: 'i1' },
      ] },
      h1: { who: 'may', text: 'Of course! Bend your legs, and, boing! Now you try!', next: 'h2' },
      h2: { who: 'oona', text: 'Boing! Boing! Oops!', next: 'h3' },
      h3: { who: 'may', text: 'That was a very good puffin hop!', next: 'z' },
      i1: { who: 'may', text: 'We come out to nibble the grass when it gets quiet, in the evening, and early in the morning.', next: 'i2' },
      i2: { who: 'narrator', text: 'Rabbits have big eyes and long ears, so they can see and hear, even in the dark.', next: 'z' },
      z: { who: 'may', text: 'Come back and visit me again soon, Oona. And bring Baba too!' },
    },
  },

  mossy: {
    friend: 'mossy', nook: 'view', start: 'a',
    nodes: {
      a: { who: 'mossy', text: 'Oona! Sit here with me. You can see the whole sea from up here!', next: 'b' },
      b: { who: 'oona', text: "Wow. It's so big. And so blue.", next: 'c' },
      c: { who: 'mossy', text: 'I come up here every day, to watch the waves, and the birds, and the clouds.', next: 'd' },
      d: { choices: [
        { thing: 'beetle', text: 'A beetle! Mossy, is that what you eat?', next: 'e1' },
        { thing: 'cloud', sky: true, text: 'Mossy, what shape is that cloud?', next: 'f1' },
      ] },
      e1: { who: 'mossy', text: "Beetles! And spiders, and woodlice. I have to eat and eat, because I'm so tiny.", next: 'e2' },
      e2: { who: 'narrator', text: 'A pygmy shrew is so small, it has to eat nearly all the time, to keep warm.', next: 'g' },
      f1: { who: 'mossy', text: 'Hmm. I think it looks like a giant fish! Or maybe a sleepy seal.', next: 'f2' },
      f2: { who: 'oona', text: 'I think it looks like Baba!', next: 'f3' },
      f3: { who: 'mossy', text: 'Ha! It does! All fluffy!', next: 'g' },
      g: { who: 'mossy', text: 'Oona, do you ever wish you could fly all the way across the sea?', next: 'h' },
      h: { choices: [
        { thing: 'feather', sky: true, text: "Look, a feather! Yes! One day I'll fly far, far away!", next: 'i1' },
        { thing: 'burrow', text: "No. Look, there's a burrow, just like ours. I like it here, on Puffin Rock.", next: 'j1' },
      ] },
      i1: { who: 'mossy', text: 'And then you would come back, and tell me all about it?', next: 'i2' },
      i2: { who: 'oona', text: 'I promise, Mossy.', next: 'z' },
      j1: { who: 'mossy', text: 'Me too. Puffin Rock is the best place in the whole wide world.', next: 'z' },
      z: { who: 'mossy', text: 'Oh! Is that a beetle? Bye, Oona!' },
    },
  },

  marvin: {
    friend: 'marvin', nook: 'bridge', start: 'a',
    nodes: {
      a: { who: 'marvin', text: 'Oh! Hello, Oona. Do you want to sit on the bridge with me? I like to watch the water.', next: 'b' },
      b: { who: 'oona', text: 'Hello, Marvin. What have you got there?', next: 'c' },
      c: { who: 'marvin', text: "It's a pebble. A special one. Look how smooth it is. I collect special things.", next: 'd' },
      d: { choices: [
        { thing: 'pebbles', text: 'Are those special things too? Can I see your collection?', next: 'e1' },
        { thing: 'fish', text: 'A fish, jumping! Do you like swimming, Marvin?', next: 'f1' },
      ] },
      e1: { who: 'marvin', text: 'Really? You want to see? Nobody ever asks! I keep it in my holt, under the tree roots.', next: 'e2' },
      e2: { who: 'narrator', text: "An otter's home is called a holt. Otters are shy, and hide their holts close to the water.", next: 'e3' },
      e3: { who: 'marvin', text: 'Here. You can have this pebble, Oona. To start a collection of your very own.', next: 'z' },
      f1: { who: 'marvin', text: 'I love swimming! Under the water, I can close up my ears, and my nose.', next: 'f2' },
      f2: { who: 'oona', text: 'You can close your ears? Wow!', next: 'f3' },
      f3: { who: 'marvin', text: 'It keeps the water out. Otters are very, very good swimmers.', next: 'z' },
      z: { who: 'marvin', text: "Thank you for sitting with me, Oona. It's nice, having a friend." },
    },
  },

  silky: {
    friend: 'silky', nook: 'rock', start: 'a',
    nodes: {
      a: { who: 'silky', text: "Hello, little Oona. Sit beside me, and let's watch the waves come in.", next: 'b' },
      b: { who: 'oona', text: 'Silky, you know everything about the sea.', next: 'c' },
      c: { who: 'silky', text: 'Not everything, dear. But I have swum a very long way.', next: 'd' },
      d: { choices: [
        { thing: 'whale', text: 'Look, a whale! Is that the biggest animal in the sea?', next: 'e1' },
        { thing: 'sparkles', text: 'What are those little sparkles in the water?', next: 'f1' },
      ] },
      e1: { who: 'silky', text: 'The blue whale. The biggest animal there has ever been. Bigger than any dinosaur!', next: 'e2' },
      e2: { who: 'narrator', text: "A blue whale's heart is as big as a little car.", next: 'g' },
      f1: { who: 'silky', text: "That's plankton, the smallest things in the sea. So tiny you can hardly see them. At night, some of them glow.", next: 'f2' },
      f2: { who: 'oona', text: 'I saw them! They sparkled when I swam!', next: 'g' },
      g: { who: 'silky', text: 'Tell me, Oona. What do you like best about the sea?', next: 'h' },
      h: { choices: [
        { thing: 'fish', text: 'Catching fish, like that one!', next: 'i1' },
        { thing: 'wave', text: 'Splashing in the waves, like that big one!', next: 'j1' },
      ] },
      i1: { who: 'silky', text: "Ha! Me too. We're both fishers, you and I.", next: 'z' },
      j1: { who: 'silky', text: "The waves are the sea's way of playing. I think it likes you too.", next: 'z' },
      z: { who: 'silky', text: "The tide is turning. Off you go, now. I'll see you in the water." },
    },
  },

  bernie: {
    friend: 'bernie', nook: 'pebble', start: 'a',
    nodes: {
      a: { who: 'bernie', text: "Ahoy, Oona! Pull up a pebble. I've been exploring the rock pools.", next: 'b' },
      b: { who: 'oona', text: 'What did you find, Bernie?', next: 'c' },
      c: { who: 'bernie', text: 'All sorts! Look closely, and a rock pool is a whole little world.', next: 'd' },
      d: { choices: [
        { thing: 'starfish', text: 'Look, a starfish!', next: 'e1' },
        { thing: 'shell', text: 'Ooh, a shell! Where do you find yours, Bernie?', next: 'f1' },
      ] },
      e1: { who: 'bernie', text: 'It is! And did you know, a starfish can grow a brand new arm, if it loses one?', next: 'e2' },
      e2: { who: 'oona', text: 'A new arm? Wow!', next: 'g' },
      f1: { who: 'bernie', text: "The sea brings them in. When a sea snail doesn't need its shell any more, someone like me can move in.", next: 'f2' },
      f2: { who: 'narrator', text: 'Sometimes hermit crabs line up, biggest to smallest, and all swap shells at once, so everyone gets a better one!', next: 'g' },
      g: { who: 'bernie', text: 'Now, Oona. A crab always says goodbye properly. Watch. Click, click, click!', next: 'z' },
      z: { who: 'oona', text: 'Click, click, click! Bye, Bernie!' },
    },
  },

  mama: {
    friend: 'mama', nook: 'nest', start: 'a',
    nodes: {
      a: { who: 'mama', text: "Come here, my little puffin. Snuggle in. Baba's nearly asleep already.", next: 'b' },
      b: { who: 'oona', text: 'Mama, will you tell me a story?', next: 'c' },
      c: { who: 'mama', text: 'Of course. Which story would you like?', next: 'd' },
      d: { choices: [
        { thing: 'eggshell', text: 'Look, a bit of eggshell! Tell me the story of when I was an egg!', next: 'e1' },
        { thing: 'leaf', text: 'This old leaf blew in with the wind. Tell me the story of the big storm!', next: 'f1' },
      ] },
      e1: { who: 'mama', text: 'Once upon a time, Papa and I made this burrow. And in it, I laid one little white egg.', next: 'e2' },
      e2: { who: 'mama', text: 'We kept it warm for weeks and weeks. Then one morning: tap, tap, crack! Out came a fluffy little puffling. And that was you.', next: 'e3' },
      e3: { who: 'narrator', text: 'Puffin mums and dads take turns, keeping their one egg warm.', next: 'g' },
      f1: { who: 'mama', text: 'Once, a great storm blew in from the sea. The wind howled, and the waves were as tall as the cliffs.', next: 'f2' },
      f2: { who: 'mama', text: 'But we were safe and dry, deep in our burrow, all cuddled up together. Just like now.', next: 'g' },
      g: { who: 'oona', text: 'Mama? I love you.', next: 'h' },
      h: { who: 'mama', text: 'I love you too, Oona. All the way to the moon, and back again.', next: 'z' },
      z: { who: 'mama', text: 'Now close your eyes. Sleep tight, my little puffin.', nap: true },
    },
  },
};

// Said the first time a choice comes up in a session.
export const HINT = { who: 'narrator', text: 'What will Oona talk about? Tap something, and see!' };

export const lineId = (friend, node, choice = null) => (choice === null ? `talk-${friend}-${node}` : `talk-${friend}-${node}-${choice + 1}`);

// Every line in every script, for lines.js to record.
export function talkLines() {
  const out = { 'talk-hint': HINT };
  for (const [friend, t] of Object.entries(TALKS)) {
    for (const [id, n] of Object.entries(t.nodes)) {
      if (n.choices) n.choices.forEach((c, i) => { out[lineId(friend, id, i)] = { who: 'oona', text: c.text }; });
      else out[lineId(friend, id)] = { who: n.who, text: n.text };
    }
  }
  return out;
}
