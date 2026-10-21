var MR = MR || {};
MR.Levels = MR.Levels || {};

// Level 1 — Coral Cove. Plain data: adding a level means adding a file
// like this one, a <script> tag for it, and adding it to MR.LevelOrder in
// js/levels/common.js.
//
// Coordinates are pixels. The seabed top is y = 480; the screen is 960 x 540.
//   solids:   { kind, x, y, w, h }      (top-left corner)
//   enemies:  fish { x, y, minX, maxX, speed }  (centre)
//             crab { x, y, speed }              (centre x, ground y)
//             booty { x, y, minX, maxX, range } (centre x, ground y)
//             beebot { x, y, minX, maxX, minY, maxY, range } (centre)
//   pickups:  pearl / heart { x, y }            (centre)
//             clam / carrot { x, y }            (centre x, ground y)
//   solid kinds: sand, rock, ledge, hang (hangs from the surface), hull,
//                deck, raft
//   boss:     optional mini-boss; any pickup with hidden: true appears once
//             he's beaten
//   theme:    one of MR.Themes (coral, kelp, trench)
//   clue:     the two lines on the level-complete screen
MR.Levels.level1 = {
  name: 'Coral Cove',
  number: 1,
  theme: 'coral',
  clue: { title: "4 Bunny's carrot!", line: 'He went this way…' },
  width: 6960,
  height: 540,
  waterTop: 40,
  playerStart: { x: 120, y: 400 },

  solids: [
    { kind: 'sand', x: 0, y: 480, w: 6960, h: 60 },

    // 2. Rock ledges to flap up onto
    { kind: 'rock', x: 1000, y: 390, w: 180, h: 90 },
    { kind: 'ledge', x: 1270, y: 300, w: 170, h: 36 },
    { kind: 'ledge', x: 1530, y: 215, w: 190, h: 36 },

    // 5. Rocks that keep the first crab in its patch of seabed
    { kind: 'rock', x: 2960, y: 420, w: 70, h: 60 },
    { kind: 'rock', x: 3560, y: 420, w: 70, h: 60 },

    // 6. Sunken ship
    { kind: 'hull', x: 4380, y: 400, w: 1120, h: 80 },
    { kind: 'deck', x: 4580, y: 300, w: 220, h: 26 },
    { kind: 'deck', x: 4980, y: 250, w: 280, h: 26 }
  ],

  enemies: [
    // 3. First Zilla-fish: alone, slow, low enough to zap from the seabed
    { type: 'fish', x: 2300, y: 450, minX: 2150, maxX: 2650, speed: 0.8 },
    // 5. First Zilla-crab
    { type: 'crab', x: 3250, y: 480, speed: 0.7 },
    // 5b. Bee Bot, alone in open water
    { type: 'beebot', x: 3960, y: 300, minX: 3700, maxX: 4220, minY: 120, maxY: 450, range: 340 },
    // 6. Ship: 2 fish and 1 crab
    { type: 'fish', x: 4510, y: 268, minX: 4440, maxX: 4940, speed: 1.1 },
    { type: 'fish', x: 5260, y: 372, minX: 5160, maxX: 5460, speed: 1.2 },
    { type: 'crab', x: 5120, y: 250, speed: 0.8 },
    // 6b. Booty, the old boot, guards the seabed past the ship
    { type: 'booty', x: 5690, y: 480, minX: 5550, maxX: 5770, range: 300 }
  ],

  pickups: [
    // 1. Open water
    { type: 'pearl', x: 320, y: 420 }, { type: 'pearl', x: 380, y: 390 },
    { type: 'pearl', x: 440, y: 375 }, { type: 'pearl', x: 500, y: 390 },
    { type: 'pearl', x: 560, y: 420 },
    { type: 'pearl', x: 700, y: 330 }, { type: 'pearl', x: 760, y: 300 },
    { type: 'pearl', x: 820, y: 330 },

    // 2. On top of the ledges
    { type: 'pearl', x: 1050, y: 365 }, { type: 'pearl', x: 1130, y: 365 },
    { type: 'pearl', x: 1320, y: 275 }, { type: 'pearl', x: 1390, y: 275 },
    { type: 'pearl', x: 1570, y: 190 }, { type: 'pearl', x: 1625, y: 190 },
    { type: 'pearl', x: 1680, y: 190 },

    // 3. Around the first fish
    { type: 'pearl', x: 2050, y: 440 }, { type: 'pearl', x: 2400, y: 300 },
    { type: 'pearl', x: 2720, y: 440 },

    // 4. Checkpoint clam 1
    { type: 'clam', x: 2840, y: 480 },

    // 5. Crab patch with a heart bubble nearby
    { type: 'heart', x: 3100, y: 340 },
    { type: 'pearl', x: 3300, y: 380 }, { type: 'pearl', x: 3400, y: 380 },

    // 5b. Bee Bot's open water
    { type: 'pearl', x: 3780, y: 440 }, { type: 'pearl', x: 3960, y: 160 },
    { type: 'pearl', x: 4140, y: 440 },

    // 6. Sunken ship
    { type: 'pearl', x: 4460, y: 375 }, { type: 'pearl', x: 4540, y: 375 },
    { type: 'pearl', x: 4860, y: 375 }, { type: 'pearl', x: 5360, y: 375 },
    { type: 'pearl', x: 4640, y: 275 }, { type: 'pearl', x: 4740, y: 275 },
    { type: 'pearl', x: 5060, y: 225 }, { type: 'pearl', x: 5120, y: 225 },
    { type: 'pearl', x: 5180, y: 225 },

    // 7. Checkpoint clam 2
    { type: 'clam', x: 5810, y: 480 },

    // 8. Short final stretch and 4 Bunny's carrot
    { type: 'heart', x: 5980, y: 330 },
    { type: 'pearl', x: 6060, y: 440 }, { type: 'pearl', x: 6160, y: 400 },
    { type: 'pearl', x: 6260, y: 360 }, { type: 'pearl', x: 6360, y: 400 },
    { type: 'pearl', x: 6460, y: 440 },
    { type: 'carrot', x: 6760, y: 480 }
  ],

  // Instructor tips at the start of the level: one short sentence plus a
  // picture (keys and/or icon). `id` is there so spoken audio can be matched
  // up later. First-meeting tips for each enemy are in js/levels/common.js.
  tips: {
    intro: [
      { id: 'swim', text: 'Hello Man Ray! Use ⬅ ➡ to swim!', keys: ['LEFT', 'RIGHT'] },
      { id: 'flap', text: 'Press ⬆ to flap your fins!', keys: ['UP'] },
      { id: 'fire', text: 'Press SPACE to fire your laser!', keys: ['SPACE'], icon: 'laser' },
      { id: 'goal', text: "Find 4 Bunny's clue at the end. Good luck!", keys: [], icon: 'carrot' }
    ]
  }
};
