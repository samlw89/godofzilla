var MR = MR || {};
MR.Levels = MR.Levels || {};

// Level 4 — Lava Lagoon. Underwater volcanoes that erupt with lava (wait for
// them to stop!), then Tri-Terror and his water tornadoes at the end.
// (Data format: see level1.js. Volcanoes are listed under `hazards`.)
MR.Levels.level4 = {
  name: 'Lava Lagoon',
  number: 4,
  theme: 'volcano',
  clue: { title: 'You beat Tri-Terror!', line: '4 Bunny must be close…' },
  width: 7200,
  height: 540,
  waterTop: 40,
  playerStart: { x: 120, y: 400 },

  solids: [
    { kind: 'sand', x: 0, y: 480, w: 7200, h: 60 },

    // 7. A ledge with a crab on it
    { kind: 'ledge', x: 5220, y: 330, w: 260, h: 36 }
  ],

  // Volcanoes: x = centre, y = ground. Neighbours erupt at different times.
  hazards: [
    { type: 'volcano', x: 1000, y: 480, offset: 0 },
    { type: 'volcano', x: 1850, y: 480, offset: 150 },
    { type: 'volcano', x: 2650, y: 480, offset: 0 },
    { type: 'volcano', x: 3050, y: 480, offset: 165 },
    { type: 'volcano', x: 4150, y: 480, offset: 80 },
    { type: 'volcano', x: 5000, y: 480, offset: 200 }
  ],

  enemies: [
    { type: 'fish', x: 1450, y: 440, minX: 1250, maxX: 1650, speed: 1.0 },
    { type: 'fish', x: 2250, y: 300, minX: 2100, maxX: 2450, speed: 1.1 },
    { type: 'beebot', x: 3800, y: 250, minX: 3550, maxX: 4000, minY: 120, maxY: 440, range: 340 },
    { type: 'booty', x: 4500, y: 480, minX: 4350, maxX: 4700, range: 300 },
    { type: 'crab', x: 5350, y: 330, speed: 0.8 }
  ],

  pickups: [
    // 1. Start
    { type: 'pearl', x: 300, y: 420 }, { type: 'pearl', x: 400, y: 380 },
    { type: 'pearl', x: 500, y: 420 },

    // 2–3. First volcanoes and fish
    { type: 'pearl', x: 1000, y: 200 },
    { type: 'pearl', x: 1250, y: 440 }, { type: 'pearl', x: 1650, y: 440 },
    { type: 'pearl', x: 1850, y: 180 }, { type: 'pearl', x: 2250, y: 420 },

    // 4. Between two volcanoes
    { type: 'pearl', x: 2850, y: 300 }, { type: 'pearl', x: 3200, y: 440 },

    // 5. Checkpoint clam 1
    { type: 'clam', x: 3350, y: 480 },
    { type: 'heart', x: 3450, y: 320 },

    // 6. Bee Bot, a volcano and Booty
    { type: 'pearl', x: 3700, y: 440 }, { type: 'pearl', x: 3800, y: 150 },
    { type: 'pearl', x: 4000, y: 440 }, { type: 'pearl', x: 4500, y: 300 },
    { type: 'pearl', x: 4800, y: 440 },

    // 7. Over the last volcano and up onto the crab's ledge
    { type: 'pearl', x: 5000, y: 170 },
    { type: 'pearl', x: 5300, y: 305 }, { type: 'pearl', x: 5400, y: 305 },

    // 8. Checkpoint clam 2
    { type: 'clam', x: 5650, y: 480 },

    // 9. Tri-Terror's arena; the carrot appears once he's beaten
    { type: 'heart', x: 5780, y: 330 },
    { type: 'pearl', x: 6000, y: 440 }, { type: 'pearl', x: 6200, y: 400 },
    { type: 'pearl', x: 6400, y: 360 }, { type: 'pearl', x: 6600, y: 400 },
    { type: 'pearl', x: 6800, y: 440 },
    { type: 'heart', x: 6700, y: 160 },
    { type: 'carrot', x: 7050, y: 480, hidden: true }
  ],

  // Boss: Tri-Terror, the screeching pterodactyl.
  boss: { type: 'triterror', x: 6550, y: 325, minX: 6150, maxX: 6900, hp: 10, speed: 1.0, swoop: 75, groundY: 480 },

  tips: {
    intro: [
      { id: 'lava-hello', text: "Welcome to Lava Lagoon! It's hot down here!", keys: [], icon: 'volcano' },
      { id: 'lava-boss', text: 'Tri-Terror is waiting at the end. Be brave!', keys: [], icon: 'triterror' }
    ]
  }
};
