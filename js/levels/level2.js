var MR = MR || {};
MR.Levels = MR.Levels || {};

// Level 2 — Kelp Forest. Tall swaying kelp, floating kelp-log rafts to hop
// between, and every helper Man Ray met in Coral Cove. (Data format: see
// level1.js.)
MR.Levels.level2 = {
  name: 'Kelp Forest',
  number: 2,
  theme: 'kelp',
  clue: { title: 'Another carrot!', line: '4 Bunny went deeper…' },
  width: 6720,
  height: 540,
  waterTop: 40,
  playerStart: { x: 120, y: 400 },

  solids: [
    { kind: 'sand', x: 0, y: 480, w: 6720, h: 60 },

    // 2. Raft hopping over a Zilla-fish
    { kind: 'raft', x: 900, y: 380, w: 170, h: 24 },
    { kind: 'raft', x: 1150, y: 300, w: 160, h: 24 },
    { kind: 'raft', x: 1400, y: 220, w: 180, h: 24 },
    { kind: 'raft', x: 1680, y: 300, w: 170, h: 24 },

    // 3. Rocks to hide behind from Bee Bot
    { kind: 'rock', x: 2150, y: 380, w: 70, h: 100 },
    { kind: 'rock', x: 2500, y: 400, w: 70, h: 80 },

    // 5. A long raft with a crab on it
    { kind: 'raft', x: 2950, y: 330, w: 320, h: 24 },

    // 6. A tall rock to flap over, then a raft
    { kind: 'rock', x: 4000, y: 300, w: 80, h: 180 },
    { kind: 'raft', x: 4180, y: 240, w: 200, h: 24 }
  ],

  enemies: [
    { type: 'fish', x: 1300, y: 450, minX: 1000, maxX: 1650, speed: 1.0 },
    { type: 'beebot', x: 2350, y: 250, minX: 2050, maxX: 2700, minY: 120, maxY: 440, range: 340 },
    { type: 'crab', x: 3100, y: 330, speed: 0.8 },
    { type: 'booty', x: 3550, y: 480, minX: 3380, maxX: 3750, range: 300 },
    { type: 'fish', x: 4350, y: 420, minX: 4150, maxX: 4600, speed: 1.1 },
    { type: 'fish', x: 4750, y: 300, minX: 4600, maxX: 5000, speed: 1.2 },
    { type: 'beebot', x: 4950, y: 230, minX: 4700, maxX: 5180, minY: 120, maxY: 440, range: 340 },
    { type: 'booty', x: 5850, y: 480, minX: 5650, maxX: 6000, range: 300 }
  ],

  pickups: [
    // 1. Start
    { type: 'pearl', x: 300, y: 420 }, { type: 'pearl', x: 360, y: 390 },
    { type: 'pearl', x: 420, y: 370 }, { type: 'pearl', x: 480, y: 390 },
    { type: 'pearl', x: 540, y: 420 },

    // 2. On the rafts
    { type: 'pearl', x: 985, y: 355 }, { type: 'pearl', x: 1230, y: 275 },
    { type: 'pearl', x: 1490, y: 195 }, { type: 'pearl', x: 1550, y: 195 },
    { type: 'pearl', x: 1765, y: 275 },

    // 3. Bee Bot's patch
    { type: 'pearl', x: 2185, y: 355 }, { type: 'pearl', x: 2350, y: 150 },
    { type: 'pearl', x: 2535, y: 375 },

    // 4. Checkpoint clam 1
    { type: 'clam', x: 2780, y: 480 },
    { type: 'heart', x: 2860, y: 300 },

    // 5. Crab raft and Booty
    { type: 'pearl', x: 3020, y: 305 }, { type: 'pearl', x: 3110, y: 305 },
    { type: 'pearl', x: 3200, y: 305 },
    { type: 'pearl', x: 3550, y: 300 }, { type: 'pearl', x: 3700, y: 440 },

    // 6. Tall rock, raft, fish and a second Bee Bot
    { type: 'pearl', x: 4040, y: 275 },
    { type: 'pearl', x: 4230, y: 215 }, { type: 'pearl', x: 4330, y: 215 },
    { type: 'pearl', x: 4500, y: 300 }, { type: 'pearl', x: 4800, y: 440 },
    { type: 'pearl', x: 4950, y: 140 },

    // 7. Checkpoint clam 2
    { type: 'clam', x: 5300, y: 480 },
    { type: 'heart', x: 5420, y: 330 },

    // 8. Past a second Booty to the carrot
    { type: 'pearl', x: 5600, y: 440 }, { type: 'pearl', x: 5700, y: 400 },
    { type: 'pearl', x: 6100, y: 400 }, { type: 'pearl', x: 6200, y: 440 },
    { type: 'carrot', x: 6450, y: 480 }
  ],

  tips: {
    intro: [
      { id: 'kelp-hello', text: 'Welcome to the Kelp Forest! Find the next clue!', keys: [], icon: 'carrot' },
      { id: 'kelp-rafts', text: 'Flap up onto the kelp rafts!', keys: ['UP'] }
    ]
  }
};
