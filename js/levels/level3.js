var MR = MR || {};
MR.Levels = MR.Levels || {};

// Level 3 — Deep Trench. Dark water, glowing coral, rocks hanging down
// from the surface to swim under — and Octo-Pie waiting at the end.
// (Data format: see level1.js.)
MR.Levels.level3 = {
  name: 'Deep Trench',
  number: 3,
  theme: 'trench',
  clue: { title: 'You beat Octo-Pie!', line: '4 Bunny is still out there…' },
  width: 7200,
  height: 540,
  waterTop: 40,
  playerStart: { x: 120, y: 400 },

  solids: [
    { kind: 'sand', x: 0, y: 480, w: 7200, h: 60 },

    // 2. Swim under a hanging rock, past a crab
    { kind: 'hang', x: 900, y: 40, w: 140, h: 210 },
    { kind: 'rock', x: 760, y: 430, w: 50, h: 50 },
    { kind: 'rock', x: 1240, y: 430, w: 50, h: 50 },

    // 3. Glowing ledges going up
    { kind: 'ledge', x: 1400, y: 370, w: 150, h: 36 },
    { kind: 'ledge', x: 1650, y: 290, w: 150, h: 36 },
    { kind: 'ledge', x: 1900, y: 200, w: 150, h: 36 },

    // 6. Another hanging rock, a crab ledge, a crab between rocks
    { kind: 'hang', x: 3500, y: 40, w: 170, h: 200 },
    { kind: 'ledge', x: 3780, y: 330, w: 260, h: 36 },
    { kind: 'rock', x: 4150, y: 430, w: 60, h: 50 },
    { kind: 'rock', x: 4550, y: 430, w: 60, h: 50 },

    // 7. A low hanging rock over Bee Bot's patch
    { kind: 'hang', x: 4800, y: 40, w: 140, h: 180 }
  ],

  enemies: [
    { type: 'crab', x: 1000, y: 480, speed: 0.8 },
    { type: 'fish', x: 1650, y: 150, minX: 1450, maxX: 1850, speed: 1.0 },
    { type: 'booty', x: 2600, y: 480, minX: 2450, maxX: 2800, range: 300 },
    { type: 'beebot', x: 2950, y: 220, minX: 2700, maxX: 3120, minY: 120, maxY: 440, range: 340 },
    { type: 'crab', x: 3900, y: 330, speed: 0.8 },
    { type: 'crab', x: 4380, y: 480, speed: 0.9 },
    { type: 'fish', x: 4350, y: 330, minX: 4150, maxX: 4600, speed: 1.2 },
    { type: 'beebot', x: 4950, y: 300, minX: 4750, maxX: 5250, minY: 260, maxY: 450, range: 340 },
    { type: 'booty', x: 5350, y: 480, minX: 5200, maxX: 5500, range: 300 }
  ],

  pickups: [
    // 1. Start
    { type: 'pearl', x: 300, y: 420 }, { type: 'pearl', x: 400, y: 380 },
    { type: 'pearl', x: 500, y: 420 },

    // 2. Under the hanging rock
    { type: 'pearl', x: 970, y: 300 }, { type: 'pearl', x: 1100, y: 300 },

    // 3. Up the glowing ledges
    { type: 'pearl', x: 1475, y: 345 }, { type: 'pearl', x: 1725, y: 265 },
    { type: 'pearl', x: 1975, y: 175 }, { type: 'pearl', x: 2025, y: 175 },

    // 4. Booty and Bee Bot together
    { type: 'pearl', x: 2450, y: 440 }, { type: 'pearl', x: 2950, y: 120 },
    { type: 'pearl', x: 3100, y: 440 },

    // 5. Checkpoint clam 1
    { type: 'clam', x: 3250, y: 480 },
    { type: 'heart', x: 3350, y: 320 },

    // 6. Crabs and a fish
    { type: 'pearl', x: 3850, y: 305 }, { type: 'pearl', x: 3950, y: 305 },
    { type: 'pearl', x: 4380, y: 380 }, { type: 'pearl', x: 4500, y: 250 },

    // 7. Bee Bot and Booty
    { type: 'pearl', x: 5000, y: 440 },

    // 8. Checkpoint clam 2
    { type: 'clam', x: 5650, y: 480 },

    // 9. Octo-Pie's arena; the carrot appears once he's beaten
    { type: 'heart', x: 5780, y: 330 },
    { type: 'pearl', x: 6000, y: 440 }, { type: 'pearl', x: 6150, y: 400 },
    { type: 'pearl', x: 6300, y: 360 }, { type: 'pearl', x: 6450, y: 400 },
    { type: 'pearl', x: 6600, y: 440 },
    { type: 'heart', x: 6700, y: 160 },
    { type: 'carrot', x: 7000, y: 480, hidden: true }
  ],

  // Mini-boss: Octo-Pie, the God of the Zillas' main helper.
  boss: { type: 'octopie', x: 6500, y: 360, minX: 6200, maxX: 6800, hp: 8, speed: 0.9, swoop: 55, throwEvery: 150 },

  tips: {
    intro: [
      { id: 'trench-hello', text: "Welcome to the Deep Trench! It's dark down here!", keys: [], icon: 'carrot' },
      { id: 'trench-rocks', text: 'Swim under the hanging rocks!', keys: ['LEFT', 'RIGHT'] },
      { id: 'trench-boss', text: 'Octo-Pie is waiting at the end. Be brave!', keys: [], icon: 'octopie' }
    ]
  }
};
