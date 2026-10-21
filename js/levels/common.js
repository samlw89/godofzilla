var MR = MR || {};

// The order levels are played in. Load this after the level files.
MR.LevelOrder = [MR.Levels.level1, MR.Levels.level2, MR.Levels.level3, MR.Levels.level4, MR.Levels.level5];

// Shown once, at the start of the first level after buying each upgrade
// at Gerald's Shop.
MR.UpgradeTips = {
  rocket: { id: 'up-rocket', text: 'Press R to fire your rocket launcher!', keys: ['R'], icon: 'rocket' },
  punch: { id: 'up-punch', text: 'Swim close to enemies to punch them!', keys: ['RIGHT'], icon: 'punch' },
  dog: { id: 'up-dog', text: 'Your sausage dog will chase off fish and crabs!', keys: [], icon: 'dog' }
};

// First-meeting tips, shown the first time each helper comes on screen
// (in any level). A list shows several tips one after another.
MR.EncounterTips = {
  fish: { id: 'fish', text: 'Watch out for Zilla-fish! Zap them with SPACE!', keys: ['SPACE'], icon: 'fish' },
  crab: { id: 'crab', text: 'Zilla-crabs are tough! Zap them TWICE!', keys: ['SPACE', 'SPACE'], icon: 'crab' },
  beebot: { id: 'beebot', text: "Watch out for Bee Bot's pointy bum! Zap him twice!", keys: ['SPACE'], times: 2, icon: 'beebot' },
  booty: { id: 'booty', text: "Watch out for Booty's stamp! Zap him 3 times!", keys: ['SPACE'], times: 3, icon: 'booty' },
  volcano: { id: 'volcano', text: 'Volcanoes shoot out lava! Wait until it stops!', keys: [], icon: 'volcano' },
  triterror: [
    { id: 'triterror', text: "It's Tri-Terror! Zap him lots of times!", keys: ['SPACE'], icon: 'triterror' },
    { id: 'tornado', text: 'When he screeches, a tornado is coming! Flap over it!', keys: ['UP'], icon: 'tornado' }
  ],
  spiky: [
    { id: 'spiky', text: "This is Spiky! He's Man Ray's friend!", keys: [], icon: 'spiky' },
    { id: 'spiky-help', text: 'Spiky will shoot his spikes to help you!', keys: [], icon: 'spiky' }
  ],
  zillagod: [
    { id: 'zillagod', text: "It's the God of the Zillas! Zap him lots!", keys: ['SPACE'], icon: 'god' },
    { id: 'fireball', text: 'When his mouth glows, zap his fireballs!', keys: ['SPACE'], icon: 'fireball' },
    { id: 'wave', text: 'When he stomps, flap over the waves!', keys: ['UP'], icon: 'wave' }
  ],
  octopie: [
    { id: 'octopie', text: "It's Octo-Pie! Zap him lots of times!", keys: ['SPACE'], icon: 'octopie' },
    { id: 'pies', text: 'Zap his pies, or swim out of the way!', keys: ['SPACE'], icon: 'pie' }
  ]
};
