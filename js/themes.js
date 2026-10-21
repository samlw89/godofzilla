var MR = MR || {};

// The look of each level. A level picks one with `theme: 'kelp'` etc.
// Used by MR.Background (water and scenery) and MR.Art.drawSolid (sand,
// rocks, ledges).
MR.Themes = {
  // Level 1 — Coral Cove: bright turquoise, flower "sky", coral reef.
  coral: {
    water: ['#7deaf5', '#3fc4dc', '#2a9fc4'],
    rays: 0.07,
    sky: 'flowers',
    far: 'reef',
    farColors: ['#78bcc9', '#86c7c0', '#8bb5d4'],
    tubeColors: ['#f3a9c8', '#f8c58c', '#c9b0f0', '#9fe0b4'],
    kelpColors: ['#3fae6a', '#2f9a5c', '#57c27a'],
    kelpHeight: 1,
    kelpLayers: 1,
    surface: 0.35,
    sand: '#f4d66b', sandEdge: '#ddb64a', sandSpeck: '#e2c055',
    rock: '#8d7fb5', rockLight: '#b3a8d6', rockSpot: '#776aa0',
    tufts: ['#ff7a8a', '#ffb347', '#ff9de2'], glowTufts: false
  },

  // Level 2 — Kelp Forest: green-gold water, sun dapples, a wall of kelp.
  kelp: {
    water: ['#a8f0c8', '#4cc79a', '#23927a'],
    rays: 0.09,
    sky: 'dapples',
    far: 'kelpwall',
    farColors: ['#5fb58a', '#6cc096', '#54a47e'],
    tubeColors: ['#9fe0b4'],
    kelpColors: ['#2f9a5c', '#3fae6a', '#1f8a4c', '#5cbf6a'],
    kelpHeight: 1.45,
    kelpLayers: 2,
    surface: 0.35,
    sand: '#e3d08e', sandEdge: '#c9b06a', sandSpeck: '#d4bf78',
    rock: '#6f8f7a', rockLight: '#94b59f', rockSpot: '#5a7864',
    tufts: ['#7ed957', '#4cbf4c', '#b5e86b'], glowTufts: false
  },

  // Level 3 — Deep Trench: dark blue, glowing plankton and glowing coral.
  trench: {
    water: ['#2f6aa8', '#18407a', '#0b1d40'],
    rays: 0.03,
    sky: 'plankton',
    far: 'glowcoral',
    farColors: ['#1d3463', '#22396b', '#1a2f5a'],
    tubeColors: ['#5ff2ff', '#ff7ae0', '#9b8cff'],
    kelpColors: ['#1f5a6a', '#245f74', '#1a4f60'],
    kelpHeight: 0.9,
    kelpLayers: 1,
    surface: 0.15,
    sand: '#55607e', sandEdge: '#3e4866', sandSpeck: '#6b7898',
    rock: '#3e4466', rockLight: '#5a628c', rockSpot: '#30355a',
    tufts: ['#5ff2ff', '#ff7ae0', '#9b8cff'], glowTufts: true
  },

  // Level 4 — Lava Lagoon: warm, smoky water, rising embers, far volcanoes.
  volcano: {
    water: ['#5a7fa0', '#3e3a5e', '#2c1a2c'],
    rays: 0.04,
    sky: 'embers',
    far: 'volcanoes',
    farColors: ['#3d2f45', '#45334a', '#36293f'],
    tubeColors: ['#ff8a3a', '#ffb347', '#ff5a3a'],
    kelpColors: ['#4a5a3a', '#556540', '#3f4e33'],
    kelpHeight: 0.8,
    kelpLayers: 1,
    surface: 0.18,
    sand: '#4a3b3b', sandEdge: '#2e2424', sandSpeck: '#6a5050',
    rock: '#4b4040', rockLight: '#6b5b58', rockSpot: '#3a3030',
    tufts: ['#ff8a3a', '#ffb347', '#ff5a3a'], glowTufts: true
  },

  // Level 5 — Zilla's Lair: the God of the Zillas' gloomy purple castle.
  lair: {
    water: ['#5a4a86', '#33245a', '#1a1030'],
    rays: 0.03,
    sky: 'embers',
    emberColor: '200,140,255',
    far: 'castle',
    farColors: ['#2a1d45', '#2f2150', '#261a3e'],
    tubeColors: ['#b07aff', '#ff5a8a', '#8a3ce0'],
    kelpColors: ['#3a2f5a', '#43356a', '#33284f'],
    kelpHeight: 0.9,
    kelpLayers: 1,
    surface: 0.14,
    sand: '#4a405e', sandEdge: '#2e2640', sandSpeck: '#6a5a86',
    rock: '#463b63', rockLight: '#625686', rockSpot: '#352c4d',
    tufts: ['#b07aff', '#ff5a8a', '#8a3ce0'], glowTufts: true
  }
};
