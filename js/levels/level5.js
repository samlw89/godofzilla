var MR = MR || {};
MR.Levels = MR.Levels || {};

// Level 5 — Zilla's Lair. The final level: Man Ray meets his friend Spiky,
// fights through the God of the Zillas' lair, and together they beat the
// God of the Zillas to set 4 Bunny free. (Data format: see level1.js.)
//   ally:  Spiky, waiting to meet Man Ray (centre x, ground y)
//   bunny: 4 Bunny, locked in a cage until the boss is beaten
MR.Levels.level5 = {
  name: "Zilla's Lair",
  number: 5,
  theme: 'lair',
  final: true,
  clue: { title: 'You rescued 4 Bunny!', line: 'Hooray!' },
  width: 7200,
  height: 540,
  waterTop: 40,
  playerStart: { x: 120, y: 400 },

  ally: { type: 'spiky', x: 620, y: 480 },

  solids: [
    { kind: 'sand', x: 0, y: 480, w: 7200, h: 60 },

    // 2. Ledges with a crab and a hanging rock
    { kind: 'ledge', x: 1250, y: 330, w: 240, h: 36 },
    { kind: 'hang', x: 1700, y: 40, w: 150, h: 190 },

    // 4. Rocks keeping a crab in its patch
    { kind: 'rock', x: 2950, y: 430, w: 60, h: 50 },
    { kind: 'rock', x: 3350, y: 430, w: 60, h: 50 }
  ],

  hazards: [
    { type: 'volcano', x: 2200, y: 480, offset: 0 },
    { type: 'volcano', x: 3900, y: 480, offset: 150 }
  ],

  enemies: [
    { type: 'fish', x: 1000, y: 430, minX: 850, maxX: 1150, speed: 1.0 },
    { type: 'crab', x: 1370, y: 330, speed: 0.8 },
    { type: 'beebot', x: 1950, y: 300, minX: 1750, maxX: 2100, minY: 260, maxY: 440, range: 340 },
    { type: 'booty', x: 2600, y: 480, minX: 2450, maxX: 2750, range: 300 },
    { type: 'crab', x: 3150, y: 480, speed: 0.9 },
    { type: 'fish', x: 3600, y: 300, minX: 3450, maxX: 3750, speed: 1.2 },
    { type: 'beebot', x: 4300, y: 250, minX: 4100, maxX: 4500, minY: 120, maxY: 440, range: 340 }
  ],

  pickups: [
    // 1. Meeting Spiky
    { type: 'pearl', x: 300, y: 420 }, { type: 'pearl', x: 400, y: 380 },
    { type: 'pearl', x: 800, y: 300 },

    // 2–3. Ledge, hanging rock, first volcano
    { type: 'pearl', x: 1320, y: 305 }, { type: 'pearl', x: 1420, y: 305 },
    { type: 'pearl', x: 1780, y: 300 }, { type: 'pearl', x: 2200, y: 200 },

    // 4. Checkpoint clam 1, then Booty and a crab
    { type: 'clam', x: 2400, y: 480 },
    { type: 'heart', x: 2480, y: 320 },
    { type: 'pearl', x: 2700, y: 300 }, { type: 'pearl', x: 3150, y: 380 },
    { type: 'pearl', x: 3600, y: 440 },

    // 5. Volcano and Bee Bot
    { type: 'pearl', x: 3900, y: 200 }, { type: 'pearl', x: 4300, y: 440 },

    // 6. Checkpoint clam 2 before the final fight
    { type: 'clam', x: 4700, y: 480 },
    { type: 'heart', x: 4820, y: 330 },

    // 7. The God of the Zillas' arena; 4 Bunny's cage at the far end
    { type: 'pearl', x: 5200, y: 440 }, { type: 'pearl', x: 5500, y: 360 },
    { type: 'heart', x: 5800, y: 160 },
    { type: 'pearl', x: 6100, y: 360 }, { type: 'pearl', x: 6400, y: 440 },
    { type: 'heart', x: 6600, y: 170 },
    { type: 'bunny', x: 7000, y: 480, locked: true }
  ],

  // The final boss.
  boss: { type: 'zillagod', x: 6200, minX: 5300, maxX: 6650, hp: 36, speed: 0.6, groundY: 480 },

  tips: {
    intro: [
      { id: 'lair-hello', text: "This is the God of the Zillas' lair!", keys: [], icon: 'god' },
      { id: 'lair-goal', text: 'Find 4 Bunny and set him free!', keys: [], icon: 'bunny' }
    ]
  }
};
