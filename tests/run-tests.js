// Automated checks for the game rules. Run with:  node tests/run-tests.js
// Loads the game's logic files (no browser needed) into a sandbox.
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var ROOT = path.join(__dirname, '..');
var FILES = [
  'js/input.js', 'js/physics.js', 'js/player.js', 'js/enemies.js', 'js/boss.js', 'js/hazards.js', 'js/ally.js', 'js/pickups.js',
  'js/world.js', 'js/instructor.js', 'js/themes.js', 'js/intro.js', 'js/shop.js', 'js/ending.js',
  'js/levels/level1.js', 'js/levels/level2.js', 'js/levels/level3.js', 'js/levels/level4.js', 'js/levels/level5.js', 'js/levels/common.js'
];

function loadGame() {
  var sandbox = vm.createContext({ console: console });
  FILES.forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
  });
  return sandbox.MR;
}

var MR = loadGame();
var C = MR.Player.C;
var passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok   ' + name);
  } catch (e) {
    failed++;
    console.log('  FAIL ' + name + '\n       ' + (e && e.message));
  }
}

function testLevel(extra) {
  var level = {
    name: 'Test', number: 0, width: 2000, height: 540, waterTop: 40,
    playerStart: { x: 100, y: 400 },
    solids: [{ kind: 'sand', x: 0, y: 480, w: 2000, h: 60 }],
    enemies: [], pickups: [],
    tips: { intro: [], encounters: {} }
  };
  for (var k in extra) level[k] = extra[k];
  return level;
}

function run(world, ticks, input) {
  for (var i = 0; i < ticks; i++) MR.World.step(world, typeof input === 'function' ? input(i) : (input || {}));
}

function placePlayer(world, x, y) {
  var p = world.player;
  p.x = x; p.y = y; p.vx = 0; p.vy = 0;
}

console.log('Physics');

test('rectangles overlap only when they really intersect', function () {
  var a = { x: 0, y: 0, w: 10, h: 10 };
  assert.ok(MR.Physics.overlaps(a, { x: 5, y: 5, w: 10, h: 10 }));
  assert.ok(!MR.Physics.overlaps(a, { x: 10, y: 0, w: 10, h: 10 }), 'touching edges do not overlap');
  assert.ok(!MR.Physics.overlaps(a, { x: 0, y: 20, w: 10, h: 10 }));
});

test('falling body lands on top of a platform', function () {
  var body = { x: 10, y: 0, w: 10, h: 10, vx: 0, vy: 15 };
  var r = MR.Physics.moveAndCollide(body, [{ x: 0, y: 20, w: 100, h: 10 }]);
  assert.strictEqual(body.y, 10);
  assert.strictEqual(body.vy, 0);
  assert.ok(r.onGround);
});

test('walls block sideways movement', function () {
  var body = { x: 0, y: 0, w: 10, h: 10, vx: 15, vy: 0 };
  var r = MR.Physics.moveAndCollide(body, [{ x: 20, y: -50, w: 10, h: 100 }]);
  assert.strictEqual(body.x, 10);
  assert.ok(r.hitX);
});

test('platforms are solid from below too', function () {
  var body = { x: 10, y: 40, w: 10, h: 10, vx: 0, vy: -15 };
  MR.Physics.moveAndCollide(body, [{ x: 0, y: 20, w: 100, h: 10 }]);
  assert.strictEqual(body.y, 30);
});

console.log('Movement');

test('Man Ray sinks slowly when not flapping', function () {
  var w = MR.World.create(testLevel());
  placePlayer(w, 100, 100);
  run(w, 100);
  assert.ok(w.player.vy <= C.MAX_SINK + 1e-9);
  assert.ok(w.player.y > 100);
});

test('flapping lifts him up but upward speed is capped', function () {
  var w = MR.World.create(testLevel());
  placePlayer(w, 100, 400);
  var fastest = 0;
  for (var i = 0; i < 40; i++) {
    MR.World.step(w, { flapPressed: true });
    fastest = Math.min(fastest, w.player.vy);
  }
  assert.ok(w.player.y < 400, 'moved up');
  assert.ok(fastest >= -C.MAX_RISE, 'never faster than MAX_RISE');
});

test('holding flap keeps flapping', function () {
  var w = MR.World.create(testLevel());
  run(w, 120, { flapHeld: true });
  assert.ok(w.player.y < 300);
});

test('swimming drifts to a stop instead of stopping dead', function () {
  var w = MR.World.create(testLevel());
  run(w, 30, { right: true });
  var speed = w.player.vx;
  assert.ok(speed > 0);
  run(w, 1);
  assert.ok(w.player.vx > 0 && w.player.vx < speed, 'slowing down');
  run(w, 120);
  assert.strictEqual(w.player.vx, 0);
});

test('Man Ray cannot leave the level or swim above the surface', function () {
  var w = MR.World.create(testLevel());
  run(w, 200, { left: true });
  assert.ok(w.player.x >= 0);
  run(w, 400, { flapHeld: true });
  assert.ok(w.player.y >= w.waterTop);
  run(w, 1200, { right: true });
  assert.ok(w.player.x + w.player.w <= w.width);
});

console.log('Hearts and respawn');

test('touching an enemy costs one heart, then a short invulnerability', function () {
  var w = MR.World.create(testLevel({
    enemies: [{ type: 'fish', x: 400, y: 420, minX: 400, maxX: 400, speed: 0 }]
  }));
  w.seenEnemyTypes.fish = true;
  placePlayer(w, 380, 400);
  run(w, 1);
  assert.strictEqual(w.player.hearts, 2);
  assert.ok(w.player.invuln > 0);
  placePlayer(w, 380, 400);
  run(w, 1);
  assert.strictEqual(w.player.hearts, 2, 'no second hit while invulnerable');
  run(w, C.INVULN_TICKS);
  placePlayer(w, 380, 400);
  run(w, 1);
  assert.strictEqual(w.player.hearts, 1, 'can be hit again later');
});

test('losing all hearts respawns at the checkpoint, keeping pearls and defeated enemies', function () {
  var w = MR.World.create(testLevel({
    enemies: [
      { type: 'fish', x: 1200, y: 420, minX: 1200, maxX: 1200, speed: 0 },
      { type: 'fish', x: 1600, y: 420, minX: 1600, maxX: 1600, speed: 0 }
    ],
    pickups: [{ type: 'pearl', x: 300, y: 460 }, { type: 'clam', x: 600, y: 480 }]
  }));
  w.seenEnemyTypes.fish = true;
  placePlayer(w, 280, 440); run(w, 1);
  assert.strictEqual(w.pearls, 1);
  placePlayer(w, 580, 440); run(w, 1);
  assert.ok(w.pickups[1].open, 'clam opened');
  w.enemies[0].alive = false;

  w.player.hearts = 1;
  placePlayer(w, 1580, 400); run(w, 1);
  var p = w.player;
  assert.strictEqual(p.hearts, C.MAX_HEARTS);
  assert.ok(Math.abs(p.x + p.w / 2 - 600) < 1, 'back at the clam');
  assert.strictEqual(w.pearls, 1, 'pearls kept');
  assert.strictEqual(w.enemies[0].alive, false, 'defeated enemy stays defeated');
  assert.ok(w.events.some(function (e) { return e.type === 'respawn'; }));
});

test('without a checkpoint, respawn is at the level start', function () {
  var w = MR.World.create(testLevel({
    enemies: [{ type: 'fish', x: 800, y: 420, minX: 800, maxX: 800, speed: 0 }]
  }));
  w.seenEnemyTypes.fish = true;
  w.player.hearts = 1;
  placePlayer(w, 780, 400); run(w, 1);
  assert.strictEqual(w.player.x, 100);
});

console.log('Laser');

test('a laser bolt defeats a Zilla-fish in one hit', function () {
  var w = MR.World.create(testLevel({
    enemies: [{ type: 'fish', x: 400, y: 460, minX: 400, maxX: 400, speed: 0 }]
  }));
  run(w, 60);
  run(w, 1, { firePressed: true });
  run(w, 40);
  assert.strictEqual(w.enemies[0].alive, false);
  assert.strictEqual(w.lasers.length, 0, 'bolt disappears on hit');
});

test('a Zilla-crab takes two hits and flashes after the first', function () {
  var w = MR.World.create(testLevel({
    enemies: [{ type: 'crab', x: 400, y: 480, speed: 0 }]
  }));
  var crab = w.enemies[0];
  run(w, 60);
  run(w, 1, { firePressed: true });
  run(w, 30);
  assert.ok(crab.alive);
  assert.strictEqual(crab.hp, 1);
  run(w, 1, { firePressed: true });
  run(w, 30);
  assert.strictEqual(crab.alive, false);
});

test('flash is set when a crab is hit', function () {
  var crab = MR.Enemies.create({ type: 'crab', x: 0, y: 100 });
  assert.strictEqual(MR.Enemies.hit(crab), false);
  assert.ok(crab.flash > 0);
  assert.strictEqual(MR.Enemies.hit(crab), true);
});

test('no more than 3 bolts on screen, with a cooldown between shots', function () {
  var w = MR.World.create(testLevel());
  var most = 0;
  for (var i = 0; i < 300; i++) {
    MR.World.step(w, { fireHeld: true, firePressed: true });
    most = Math.max(most, w.lasers.length);
  }
  assert.strictEqual(most, 3);
  var w2 = MR.World.create(testLevel());
  run(w2, 1, { firePressed: true });
  run(w2, 1, { firePressed: true });
  assert.strictEqual(w2.lasers.length, 1, 'cooldown blocks instant second shot');
});

test('bolts vanish on hitting a solid or after a fixed distance', function () {
  var w = MR.World.create(testLevel({
    solids: [{ kind: 'sand', x: 0, y: 480, w: 2000, h: 60 }, { kind: 'rock', x: 250, y: 300, w: 40, h: 180 }]
  }));
  run(w, 1, { firePressed: true });
  run(w, 20);
  assert.strictEqual(w.lasers.length, 0, 'stopped by the rock');

  var w2 = MR.World.create(testLevel());
  run(w2, 1, { firePressed: true });
  run(w2, Math.ceil(C.LASER_RANGE / C.LASER_SPEED) + 2);
  assert.strictEqual(w2.lasers.length, 0, 'gone after its range');
});

test('bolts come out of the blaster muzzle in front of Man Ray', function () {
  var w = MR.World.create(testLevel());
  run(w, 60);
  run(w, 1, { firePressed: true });
  var p = w.player, l = w.lasers[0];
  assert.ok(Math.abs(l.x - (p.x + p.w / 2 + C.GUN_X + C.LASER_SPEED)) < 1e-6, 'starts at the muzzle');
  assert.ok(Math.abs(l.y + l.h / 2 - (p.y + p.h / 2 + C.GUN_Y)) < 1e-6);
  var w2 = MR.World.create(testLevel());
  run(w2, 60);
  w2.player.facing = -1;
  w2.player.x = 400;
  run(w2, 1, { firePressed: true });
  var l2 = w2.lasers[0];
  assert.ok(l2.x + l2.w < w2.player.x, 'fires out of the left side when facing left');
});

test('a bolt does not appear on the far side of a rock he is touching', function () {
  var w = MR.World.create(testLevel({
    solids: [{ kind: 'sand', x: 0, y: 480, w: 2000, h: 60 }, { kind: 'rock', x: 150, y: 300, w: 40, h: 180 }]
  }));
  run(w, 60);
  w.player.x = 150 - w.player.w;
  run(w, 1, { firePressed: true });
  assert.strictEqual(w.lasers.length, 0);
});

console.log('Pickups');

test('pearls add one to the count', function () {
  var w = MR.World.create(testLevel({ pickups: [{ type: 'pearl', x: 124, y: 460 }] }));
  run(w, 1);
  assert.strictEqual(w.pearls, 1);
  assert.ok(w.pickups[0].collected);
  assert.strictEqual(w.totalPearls, 1);
});

test('heart bubbles restore a heart but stay put at full hearts', function () {
  var w = MR.World.create(testLevel({ pickups: [{ type: 'heart', x: 124, y: 460 }] }));
  run(w, 5);
  assert.strictEqual(w.player.hearts, 3);
  assert.ok(!w.pickups[0].collected, 'ignored at full hearts');
  w.player.hearts = 2;
  run(w, 1);
  assert.strictEqual(w.player.hearts, 3);
  assert.ok(w.pickups[0].collected);
});

test('clam checkpoint opens once and becomes the respawn point', function () {
  var w = MR.World.create(testLevel({ pickups: [{ type: 'clam', x: 124, y: 480 }] }));
  run(w, 1);
  assert.ok(w.pickups[0].open);
  assert.ok(w.events.some(function (e) { return e.type === 'chime'; }));
  run(w, 1);
  assert.ok(!w.events.some(function (e) { return e.type === 'chime'; }), 'only chimes once');
  assert.strictEqual(w.checkpoint.y, 480 - C.H - 1);
});

test('opening a clam releases a golden pearl that floats up out of it', function () {
  var w = MR.World.create(testLevel({ pickups: [{ type: 'clam', x: 124, y: 480 }] }));
  run(w, 1);
  var golden = w.pickups.filter(function (p) { return p.type === 'golden'; });
  assert.strictEqual(golden.length, 1);
  assert.strictEqual(golden[0].cy, 480 - MR.Pickups.GOLDEN_HEIGHT, 'floats to above the clam');
  run(w, 5);
  assert.strictEqual(w.pickups.filter(function (p) { return p.type === 'golden'; }).length, 1, 'only one per clam');
});

test('the golden pearl can be caught once it has risen, for a bonus', function () {
  var w = MR.World.create(testLevel({ pickups: [{ type: 'clam', x: 124, y: 480 }] }));
  run(w, 1);
  var g = w.pickups.filter(function (p) { return p.type === 'golden'; })[0];
  // Swim up into it straight away: too soon, it's still rising.
  placePlayer(w, g.x, g.y);
  run(w, 1);
  assert.ok(!g.collected, 'still rising');
  run(w, MR.Pickups.GOLDEN_RISE_TICKS);
  placePlayer(w, g.x, g.y);
  run(w, 1);
  assert.ok(g.collected);
  assert.strictEqual(w.pearls, MR.Pickups.GOLDEN_VALUE);
  assert.strictEqual(w.golden, 1);
  assert.ok(w.events.some(function (e) { return e.type === 'golden'; }));
  assert.strictEqual(w.popups.length, 1, '+5 pops up');
});

test('totals count golden pearls, and an uncaught one waits after respawning', function () {
  var w = MR.World.create(testLevel({
    pickups: [{ type: 'pearl', x: 1000, y: 300 }, { type: 'clam', x: 124, y: 480 }, { type: 'clam', x: 1500, y: 480 }],
    enemies: [{ type: 'fish', x: 800, y: 420, minX: 800, maxX: 800, speed: 0 }]
  }));
  assert.strictEqual(w.totalGolden, 2);
  assert.strictEqual(w.totalPearls, 1 + 2 * MR.Pickups.GOLDEN_VALUE);
  w.seenEnemyTypes.fish = true;
  run(w, 1);
  w.player.hearts = 1;
  placePlayer(w, 780, 400);
  run(w, 1);
  assert.strictEqual(w.player.hearts, 3, 'respawned');
  var g = w.pickups.filter(function (p) { return p.type === 'golden'; })[0];
  assert.ok(g && !g.collected, 'golden pearl still there to catch');
});

test('golden pearls float up into open water in every level', function () {
  MR.LevelOrder.forEach(function (L) {
    var w = MR.World.create(L);
    w.pickups.filter(function (p) { return p.type === 'clam'; }).forEach(function (c) {
      var g = MR.Pickups.create({ type: 'golden', x: c.cx, y: c.groundY - MR.Pickups.GOLDEN_HEIGHT });
      assert.ok(!MR.Physics.overlapsAny(g, w.solids), L.name + ': clam at ' + c.cx);
    });
  });
});

test('touching the glowing carrot completes the level', function () {
  var w = MR.World.create(testLevel({ pickups: [{ type: 'carrot', x: 300, y: 480 }] }));
  run(w, 200, { right: true });
  assert.ok(w.complete);
  var x = w.player.x;
  run(w, 10, { right: true });
  assert.strictEqual(w.player.x, x, 'play stops once complete');
});

console.log('Enemies');

test('Zilla-fish stays on its patrol path', function () {
  var w = MR.World.create(testLevel({
    enemies: [{ type: 'fish', x: 800, y: 200, minX: 700, maxX: 900, speed: 2 }]
  }));
  var f = w.enemies[0];
  for (var i = 0; i < 600; i++) {
    MR.World.step(w, {});
    var cx = f.x + f.w / 2;
    assert.ok(cx >= 700 - 1e-9 && cx <= 900 + 1e-9);
  }
});

test('Zilla-crab turns around at platform edges', function () {
  var w = MR.World.create(testLevel({
    solids: [{ kind: 'sand', x: 0, y: 480, w: 2000, h: 60 }, { kind: 'deck', x: 800, y: 300, w: 200, h: 26 }],
    enemies: [{ type: 'crab', x: 900, y: 300, speed: 1.5 }]
  }));
  var crab = w.enemies[0];
  for (var i = 0; i < 800; i++) {
    MR.World.step(w, {});
    assert.ok(crab.y + crab.h <= 300.0001, 'still on the platform');
  }
});

test('Zilla-crab turns around at walls', function () {
  var w = MR.World.create(testLevel({
    solids: [
      { kind: 'sand', x: 0, y: 480, w: 2000, h: 60 },
      { kind: 'rock', x: 700, y: 420, w: 60, h: 60 },
      { kind: 'rock', x: 1000, y: 420, w: 60, h: 60 }
    ],
    enemies: [{ type: 'crab', x: 880, y: 480, speed: 1.5 }]
  }));
  var crab = w.enemies[0];
  for (var i = 0; i < 800; i++) {
    MR.World.step(w, {});
    assert.ok(crab.x >= 760 && crab.x + crab.w <= 1000);
  }
});

console.log('Booty');

function bootyLevel() {
  return testLevel({
    enemies: [{ type: 'booty', x: 900, y: 480, minX: 750, maxX: 1050, range: 300 }]
  });
}

test('Booty waits until Man Ray is near', function () {
  var w = MR.World.create(bootyLevel());
  run(w, 200);
  assert.strictEqual(w.enemies[0].state, 'idle');
});

test('Booty crouches as a warning before he jumps', function () {
  var w = MR.World.create(bootyLevel());
  placePlayer(w, 700, 416);
  run(w, 5);
  var b = w.enemies[0];
  assert.strictEqual(b.state, 'windup');
  run(w, MR.Enemies.BOOTY.WINDUP_TICKS - 10);
  assert.strictEqual(b.state, 'windup', 'still warning');
  run(w, 15);
  assert.strictEqual(b.state, 'jump');
  assert.ok(b.jumpVx < 0, 'jumps toward Man Ray');
});

test('Booty lands with a stomp, stays on his patch, then rests', function () {
  var w = MR.World.create(bootyLevel());
  var b = w.enemies[0];
  var stomped = false;
  w.player.invuln = 1e9;
  placePlayer(w, 650, 416);
  for (var i = 0; i < 200; i++) {
    MR.World.step(w, {});
    if (w.events.some(function (e) { return e.type === 'stomp'; })) { stomped = true; break; }
    assert.ok(b.x + b.w / 2 >= 750 - 1e-9 && b.x + b.w / 2 <= 1050 + 1e-9);
  }
  assert.ok(stomped);
  assert.strictEqual(b.state, 'idle');
  assert.ok(b.timer > 0, 'resting before the next stamp');
  assert.strictEqual(b.y + b.h, 480, 'back on the seabed');
});

test("Booty's stamp costs Man Ray a heart", function () {
  var w = MR.World.create(bootyLevel());
  placePlayer(w, 850, 416);
  for (var i = 0; i < 200 && w.player.hearts === 3; i++) {
    w.player.x = 850; w.player.vx = 0;
    MR.World.step(w, {});
  }
  assert.strictEqual(w.player.hearts, 2);
});

test('Booty takes 3 laser hits', function () {
  var b = MR.Enemies.create({ type: 'booty', x: 0, y: 480 });
  assert.strictEqual(MR.Enemies.hit(b), false);
  assert.strictEqual(MR.Enemies.hit(b), false);
  assert.strictEqual(MR.Enemies.hit(b), true);
});

console.log('Bee Bot');

function beeLevel() {
  return testLevel({
    enemies: [{ type: 'beebot', x: 1000, y: 300, minX: 700, maxX: 1300, minY: 120, maxY: 450, range: 340 }]
  });
}

test('Bee Bot hovers at home until Man Ray is near', function () {
  var w = MR.World.create(beeLevel());
  run(w, 300);
  var b = w.enemies[0];
  assert.strictEqual(b.state, 'hover');
  assert.ok(Math.abs(b.x + b.w / 2 - 1000) < 5);
});

test('Bee Bot turns his bum toward Man Ray as a warning before stinging', function () {
  var w = MR.World.create(beeLevel());
  var b = w.enemies[0];
  w.player.invuln = 1e9;
  placePlayer(w, 750, 416);
  for (var i = 0; i < 200 && b.state === 'hover'; i++) { w.player.x = 750; MR.World.step(w, {}); }
  assert.strictEqual(b.state, 'aim');
  assert.strictEqual(b.dir, 1, 'facing away, bum toward Man Ray on his left');
  run(w, MR.Enemies.BEEBOT.AIM_TICKS - 5);
  assert.strictEqual(b.state, 'aim', 'still warning');
  run(w, 10);
  assert.strictEqual(b.state, 'sting');
  assert.ok(b.dashVx < 0, 'dashes toward Man Ray');
});

test("Bee Bot's sting costs Man Ray a heart, then he rests", function () {
  var w = MR.World.create(beeLevel());
  var b = w.enemies[0];
  placePlayer(w, 800, 416);
  var rested = false;
  for (var i = 0; i < 400; i++) {
    w.player.x = 800; w.player.y = 416; w.player.vx = 0; w.player.vy = 0;
    MR.World.step(w, {});
    if (b.state === 'recover') rested = true;
    if (w.player.hearts < 3 && rested) break;
  }
  assert.ok(w.player.hearts < 3, 'stung');
  assert.ok(rested, 'rests after a sting');
});

test('Bee Bot stays inside his patch', function () {
  var w = MR.World.create(beeLevel());
  var b = w.enemies[0];
  w.player.invuln = 1e9;
  for (var i = 0; i < 1500; i++) {
    w.player.x = 400 + (i % 600) * 1.5; w.player.invuln = 1e9;
    MR.World.step(w, {});
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    assert.ok(cx >= 700 - 1e-9 && cx <= 1300 + 1e-9, 'x ' + cx);
    assert.ok(cy >= 120 - 1e-9 && cy <= 450 + 1e-9, 'y ' + cy);
  }
});

test('Bee Bot takes 2 laser hits', function () {
  var b = MR.Enemies.create({ type: 'beebot', x: 0, y: 200 });
  assert.strictEqual(MR.Enemies.hit(b), false);
  assert.strictEqual(MR.Enemies.hit(b), true);
});

console.log('Mini-boss: Octo-Pie');

function bossLevel(extra) {
  var L = testLevel({
    boss: { type: 'octopie', x: 700, y: 400, minX: 600, maxX: 800, hp: 8, speed: 0, swoop: 0, throwEvery: 150 },
    pickups: [{ type: 'carrot', x: 1500, y: 480, hidden: true }]
  });
  for (var k in extra) L[k] = extra[k];
  return L;
}

function zapBoss(w, times) {
  for (var i = 0; i < times; i++) {
    w.player.invuln = 999;
    run(w, 1, { firePressed: true });
    run(w, 40);
  }
}

test('Octo-Pie sleeps until he comes on screen, then wakes with tips', function () {
  var w = MR.World.create(bossLevel());
  w.player.x = 100;
  MR.World.snapCamera(w);
  w.boss.x = 1800;
  run(w, 5);
  assert.ok(!w.boss.active);
  w.boss.x = 650;
  run(w, 1);
  assert.ok(w.boss.active);
  assert.ok(w.events.some(function (e) { return e.type === 'encounter' && e.enemy === 'octopie'; }));
  var tips = MR.EncounterTips.octopie;
  assert.ok(Array.isArray(tips) && tips.length === 2);
});

test('Octo-Pie takes 8 zaps, and the carrot appears when he is beaten', function () {
  var w = MR.World.create(bossLevel());
  placePlayer(w, 400, 400);
  run(w, 60);
  w.boss.active = true;
  w.boss.throwTimer = 1e9;
  zapBoss(w, 7);
  assert.ok(w.boss.alive);
  assert.strictEqual(w.boss.hp, 1);
  assert.ok(w.pickups[0].hidden, 'carrot still hidden');
  zapBoss(w, 1);
  assert.strictEqual(w.boss.alive, false);
  assert.ok(!w.pickups[0].hidden, 'carrot revealed');
});

test('the hidden carrot cannot be collected before the boss is beaten', function () {
  var w = MR.World.create(bossLevel());
  w.boss.alive = false;
  w.pickups[0].hidden = true;
  placePlayer(w, 1480, 420);
  run(w, 5);
  assert.ok(!w.complete);
});

test('Octo-Pie throws pies, which cost a heart', function () {
  var w = MR.World.create(bossLevel());
  w.boss.active = true;
  w.boss.throwTimer = 1;
  run(w, 1);
  assert.strictEqual(w.pies.length, 1);
  assert.ok(w.pies[0].vx < 0, 'thrown toward Man Ray');
  var pie = w.pies[0];
  placePlayer(w, pie.x - 30, pie.y - 20);
  run(w, 10);
  assert.strictEqual(w.player.hearts, 2);
  assert.strictEqual(w.pies.length, 0, 'pie is used up');
});

test('lasers can zap pies out of the air', function () {
  var w = MR.World.create(bossLevel({ boss: { type: 'octopie', x: 1800, y: 300, minX: 1800, maxX: 1800, speed: 0, swoop: 0 } }));
  run(w, 60);
  w.pies.push({ x: 300, y: w.player.y + w.player.h * 0.6 - 11, w: 30, h: 22, vx: -1, life: 500, spin: 0 });
  run(w, 1, { firePressed: true });
  run(w, 30);
  assert.strictEqual(w.pies.length, 0);
  assert.strictEqual(w.player.hearts, 3);
});

test('Octo-Pie gets faster and throws more often at half health', function () {
  var w = MR.World.create(bossLevel());
  var b = w.boss;
  assert.ok(!MR.Boss.isAngry(b));
  b.hp = 4;
  assert.ok(MR.Boss.isAngry(b));
  b.active = true;
  b.throwTimer = 1;
  run(w, 1);
  assert.ok(b.throwTimer < b.throwEvery);
});

test('respawning keeps the damage done to Octo-Pie and clears pies', function () {
  var w = MR.World.create(bossLevel());
  w.boss.active = true;
  w.boss.hp = 3;
  w.pies.push({ x: 1200, y: 300, w: 30, h: 22, vx: -1, life: 500, spin: 0 });
  w.player.hearts = 1;
  placePlayer(w, w.boss.x, w.boss.y + 20);
  run(w, 1);
  assert.strictEqual(w.player.hearts, 3);
  assert.strictEqual(w.boss.hp, 3);
  assert.strictEqual(w.pies.length, 0);
});

console.log('Instructor');

test('a first-encounter tip fires once per enemy type when it comes on screen', function () {
  var w = MR.World.create(testLevel({
    enemies: [
      { type: 'fish', x: 1500, y: 300, minX: 1500, maxX: 1500, speed: 0 },
      { type: 'fish', x: 1700, y: 300, minX: 1700, maxX: 1700, speed: 0 }
    ]
  }));
  var count = 0;
  for (var i = 0; i < 600; i++) {
    MR.World.step(w, { right: true });
    count += w.events.filter(function (e) { return e.type === 'encounter'; }).length;
  }
  assert.strictEqual(count, 1);
});

test('tips advance one at a time and can be skipped', function () {
  var ins = MR.Instructor.create();
  var tips = MR.Levels.level1.tips.intro;
  MR.Instructor.show(ins, tips, true);
  assert.strictEqual(ins.current.id, 'swim');
  MR.Instructor.next(ins);
  assert.strictEqual(ins.current.id, 'flap');
  MR.Instructor.skip(ins);
  assert.ok(!MR.Instructor.isActive(ins));
  MR.Instructor.enqueue(ins, MR.EncounterTips.fish);
  assert.ok(MR.Instructor.isActive(ins));
  assert.ok(!ins.isIntro, 'encounter tips are not skippable intro tips');
});

test('every tip has text and a picture', function () {
  var all = [];
  MR.LevelOrder.forEach(function (L) { all = all.concat(L.tips.intro); });
  Object.keys(MR.EncounterTips).forEach(function (k) { all = all.concat(MR.EncounterTips[k]); });
  all.forEach(function (tip) {
    assert.ok(tip.text && tip.text.length < 60, tip.id + ' text is short');
    assert.ok((tip.keys && tip.keys.length) || tip.icon, tip.id + ' has a picture');
  });
});

console.log('Volcanoes');

function volcanoLevel(extra) {
  return testLevel(Object.assign({ hazards: [{ type: 'volcano', x: 800, y: 480, offset: 0 }] }, extra || {}));
}

function stepUntil(w, phase, max) {
  for (var i = 0; i < (max || 1000); i++) {
    MR.World.step(w, {});
    if (w.hazards[0].phase === phase) return true;
  }
  return false;
}

test('a volcano is solid, so Man Ray must go over it', function () {
  var w = MR.World.create(volcanoLevel());
  w.player.invuln = 1e9;
  for (var i = 0; i < 300; i++) MR.World.step(w, { right: true });
  assert.ok(w.player.x + w.player.w <= 800 - 69, 'stopped by the cone');
});

test('a volcano warns before it erupts, then lava shoots up', function () {
  var w = MR.World.create(volcanoLevel());
  var hz = w.hazards[0];
  assert.strictEqual(hz.phase, 'idle');
  assert.strictEqual(MR.Hazards.lavaRect(hz), null, 'no lava while quiet');
  assert.ok(stepUntil(w, 'warn'));
  assert.strictEqual(MR.Hazards.lavaRect(hz), null, 'no lava during the warning');
  var warnTicks = 0;
  while (hz.phase === 'warn') { MR.World.step(w, {}); warnTicks++; }
  assert.ok(warnTicks >= 60, 'at least a second of warning');
  assert.strictEqual(hz.phase, 'erupt');
  for (var i = 0; i < 20; i++) MR.World.step(w, {});
  assert.ok(MR.Hazards.lavaHeight(hz) > 150, 'lava column');
  assert.ok(w.lavaBlobs.length > 0, 'lava blobs fly out');
});

test('touching lava costs a heart; standing back is safe', function () {
  var w = MR.World.create(volcanoLevel());
  placePlayer(w, 300, 416);
  stepUntil(w, 'erupt');
  for (var i = 0; i < 200; i++) { w.player.x = 300; MR.World.step(w, {}); }
  assert.strictEqual(w.player.hearts, 3, 'safe at a distance');
  var w2 = MR.World.create(volcanoLevel());
  stepUntil(w2, 'erupt');
  for (var j = 0; j < 20; j++) MR.World.step(w2, {});
  placePlayer(w2, 800 - 22, 200);
  MR.World.step(w2, {});
  assert.strictEqual(w2.player.hearts, 2, 'burned by the lava column');
});

test('neighbouring volcanoes can be set to erupt at different times', function () {
  var a = MR.Hazards.create({ type: 'volcano', x: 0, y: 480, offset: 0 });
  var b = MR.Hazards.create({ type: 'volcano', x: 0, y: 480, offset: 165 });
  var together = 0;
  for (var t = 0; t < 330; t++) {
    if (MR.Hazards.phaseAt(a, t).phase === 'erupt' && MR.Hazards.phaseAt(b, t).phase === 'erupt') together++;
  }
  assert.strictEqual(together, 0);
});

test('a volcano has a first-meeting tip', function () {
  var w = MR.World.create(volcanoLevel());
  var tips = 0;
  for (var i = 0; i < 400; i++) {
    MR.World.step(w, { right: true });
    tips += w.events.filter(function (e) { return e.type === 'encounter' && e.enemy === 'volcano'; }).length;
  }
  assert.strictEqual(tips, 1);
  assert.ok(MR.EncounterTips.volcano);
});

console.log('Boss: Tri-Terror');

function triLevel() {
  return testLevel({
    boss: { type: 'triterror', x: 1000, y: 300, minX: 800, maxX: 1200, hp: 10, speed: 1, swoop: 0, groundY: 480 }
  });
}

test('Tri-Terror screeches as a warning, then spins and sends a tornado', function () {
  var w = MR.World.create(triLevel());
  var b = w.boss;
  b.active = true;
  b.attackTimer = 1;
  run(w, 1);
  assert.strictEqual(b.state, 'screech');
  assert.ok(w.events.some(function (e) { return e.type === 'screech'; }));
  run(w, MR.Boss.TRI.SCREECH_TICKS - 5);
  assert.strictEqual(w.tornadoes.length, 0, 'no tornado during the warning');
  run(w, 5 + MR.Boss.TRI.SPIN_TICKS);
  assert.strictEqual(w.tornadoes.length, 1);
  var tw = w.tornadoes[0];
  assert.ok(tw.vx < 0, 'rolls toward Man Ray');
  assert.strictEqual(tw.y + tw.h, 480, 'along the seabed');
  assert.strictEqual(b.state, 'fly');
});

test('a tornado costs a heart, but flapping above it is safe', function () {
  var w = MR.World.create(triLevel());
  w.tornadoes.push({ x: 300, y: 480 - MR.Boss.TORNADO.h, w: MR.Boss.TORNADO.w, h: MR.Boss.TORNADO.h, vx: -2.3, life: 400 });
  placePlayer(w, 200, 416);
  for (var i = 0; i < 60; i++) MR.World.step(w, {});
  assert.strictEqual(w.player.hearts, 2, 'hit on the seabed');
  var w2 = MR.World.create(triLevel());
  w2.tornadoes.push({ x: 300, y: 480 - MR.Boss.TORNADO.h, w: MR.Boss.TORNADO.w, h: MR.Boss.TORNADO.h, vx: -2.3, life: 400 });
  for (var j = 0; j < 160; j++) { placePlayer(w2, 200, 480 - MR.Boss.TORNADO.h - w2.player.h - 4); MR.World.step(w2, {}); }
  assert.strictEqual(w2.player.hearts, 3, 'safe above it');
});

test('Tri-Terror takes 10 zaps and attacks more often when angry', function () {
  var w = MR.World.create(triLevel());
  var b = w.boss;
  for (var i = 0; i < 9; i++) MR.Boss.hit(b);
  assert.ok(b.alive);
  assert.ok(MR.Boss.isAngry(b));
  b.active = true; b.state = 'spin'; b.stateTimer = 1;
  run(w, 1);
  assert.strictEqual(b.attackTimer, MR.Boss.TRI.ANGRY_ATTACK_EVERY);
  assert.strictEqual(MR.Boss.hit(b), true, 'tenth zap beats him');
});

console.log("Gerald's Shop");

test('three upgrades at 10, 20 and 30 pearls', function () {
  assert.deepStrictEqual(MR.Shop.ITEMS.map(function (i) { return i.price; }).join(','), '10,20,30');
  assert.deepStrictEqual(MR.Shop.ITEMS.map(function (i) { return i.id; }).join(','), 'rocket,punch,dog');
});

test('buying spends pearls, and you can only buy each thing once', function () {
  var shop = MR.Shop.create(35, {}, false);
  assert.strictEqual(MR.Shop.buy(shop, 'punch'), 'bought');
  assert.strictEqual(shop.wallet, 15);
  assert.ok(shop.owned.punch);
  assert.strictEqual(MR.Shop.buy(shop, 'punch'), 'owned');
  assert.strictEqual(shop.wallet, 15);
});

test("you can't buy what you can't afford", function () {
  var shop = MR.Shop.create(25, {}, false);
  assert.strictEqual(MR.Shop.buy(shop, 'dog'), 'poor');
  assert.strictEqual(shop.wallet, 25);
  assert.ok(!shop.owned.dog);
});

test('arrows choose, SPACE buys, and the last choice is "Next level"', function () {
  var shop = MR.Shop.create(100, {}, false);
  assert.strictEqual(shop.sel, 0, 'starts on something you can afford');
  MR.Shop.update(shop, { right: true });
  assert.strictEqual(MR.Shop.update(shop, { choose: true }), 'bought');
  assert.ok(shop.owned.punch);
  MR.Shop.update(shop, { right: true });
  MR.Shop.update(shop, { right: true });
  assert.strictEqual(shop.sel, MR.Shop.GO);
  assert.strictEqual(MR.Shop.update(shop, { choose: true }), 'done');
  assert.ok(shop.done);
});

test('clicking a card buys it; clicking the button moves on', function () {
  var shop = MR.Shop.create(100, {}, false);
  assert.strictEqual(MR.Shop.hitTest(430, 250), 0);
  assert.strictEqual(MR.Shop.update(shop, { clickIndex: MR.Shop.hitTest(430, 250) }), 'bought');
  assert.ok(shop.owned.rocket);
  assert.strictEqual(MR.Shop.hitTest(670, 430), MR.Shop.GO);
  assert.strictEqual(MR.Shop.hitTest(5, 5), null);
});

console.log('Upgrades');

test('Rocket Launcher: R fires a rocket out of the launcher; SPACE does not', function () {
  var w = MR.World.create(testLevel(), { upgrades: { rocket: true } });
  run(w, 60);
  run(w, 1, { firePressed: true });
  assert.strictEqual(w.lasers.filter(function (l) { return l.kind === 'rocket'; }).length, 0, 'SPACE: laser only');
  run(w, 1, { rocketPressed: true });
  var rocket = w.lasers.filter(function (l) { return l.kind === 'rocket'; })[0];
  assert.ok(rocket, 'R: rocket');
  var p = w.player, C = MR.Player.C;
  assert.ok(Math.abs(rocket.x - (p.x + p.w / 2 + C.ROCKET_X + C.ROCKET_SPEED)) < 1e-6, 'from the launcher mouth');
  var mouthY = p.y + p.h / 2 + C.ROCKET_Y;
  assert.ok(Math.abs(rocket.y + rocket.h / 2 - mouthY) < 6, 'starts at mouth height');
  run(w, 30);
  assert.ok(Math.abs(rocket.y + rocket.h / 2 - (p.y + p.h / 2 + C.GUN_Y)) < 1, 'then flies along the laser line');
});

test('R does nothing without the Rocket Launcher', function () {
  var w = MR.World.create(testLevel());
  run(w, 60);
  run(w, 1, { rocketPressed: true });
  assert.strictEqual(w.lasers.length, 0);
});

test('a rocket hits twice as hard: a crab goes down in one rocket', function () {
  var w = MR.World.create(testLevel({ enemies: [{ type: 'crab', x: 500, y: 480, speed: 0 }] }), { upgrades: { rocket: true } });
  w.seenEnemyTypes.crab = true;
  run(w, 60);
  run(w, 1, { rocketPressed: true });
  run(w, 60);
  assert.strictEqual(w.enemies[0].alive, false);
});

test('rockets have their own limit and wait, and do not use up laser bolts', function () {
  var w = MR.World.create(testLevel(), { upgrades: { rocket: true } });
  var bolts = 0, rockets = 0;
  for (var i = 0; i < 300; i++) {
    MR.World.step(w, { fireHeld: true, rocketHeld: true });
    bolts = Math.max(bolts, w.lasers.filter(function (l) { return l.kind !== 'rocket'; }).length);
    rockets = Math.max(rockets, w.lasers.filter(function (l) { return l.kind === 'rocket'; }).length);
  }
  assert.strictEqual(bolts, MR.Player.C.MAX_LASERS);
  assert.strictEqual(rockets, MR.Player.C.MAX_ROCKETS);
  var w2 = MR.World.create(testLevel(), { upgrades: { rocket: true } });
  run(w2, 60);
  run(w2, 1, { rocketPressed: true });
  run(w2, 1, { rocketPressed: true });
  assert.strictEqual(w2.lasers.length, 1, 'cooldown between rockets');
});

test('every upgrade has a one-time tip with a picture', function () {
  ['rocket', 'punch', 'dog'].forEach(function (id) {
    var tip = MR.UpgradeTips[id];
    assert.ok(tip && tip.text.length < 60 && (tip.icon || tip.keys.length), id);
  });
  assert.deepStrictEqual(MR.UpgradeTips.rocket.keys.join(), 'R');
});

test('Mega Punch: an enemy that comes close in front gets punched', function () {
  var w = MR.World.create(testLevel({ enemies: [{ type: 'crab', x: 700, y: 480, speed: 0 }] }), { upgrades: { punch: true } });
  w.seenEnemyTypes.crab = true;
  run(w, 60);
  assert.ok(w.enemies[0].alive, 'too far away to punch');
  w.player.x = 700 - 25 - w.player.w - 30;
  run(w, 1);
  assert.strictEqual(w.enemies[0].alive, false, 'a 2-hit crab goes down in one punch');
  assert.ok(w.events.some(function (e) { return e.type === 'punch'; }));
  assert.strictEqual(w.player.hearts, 3);
});

test('Mega Punch only punches in front, and needs a moment between punches', function () {
  var w = MR.World.create(testLevel({ enemies: [{ type: 'booty', x: 60, y: 480 }] }), { upgrades: { punch: true } });
  w.seenEnemyTypes.booty = true;
  w.player.invuln = 1e9;
  run(w, 5);
  assert.ok(w.enemies[0].alive && w.enemies[0].hp === 3, 'behind him: no punch');
  var w2 = MR.World.create(testLevel({ boss: { type: 'octopie', x: 220, y: 440, minX: 220, maxX: 220, speed: 0, swoop: 0 } }), { upgrades: { punch: true } });
  w2.boss.active = true; w2.boss.throwTimer = 1e9;
  w2.player.invuln = 1e9;
  run(w2, 1);
  var after = w2.boss.hp;
  assert.strictEqual(after, w2.boss.maxHp - MR.Player.C.PUNCH_DAMAGE);
  run(w2, 5);
  assert.strictEqual(w2.boss.hp, after, 'waits before punching again');
});

test('without the upgrades nothing extra happens', function () {
  var w = MR.World.create(testLevel());
  run(w, 60);
  run(w, 1, { firePressed: true });
  assert.strictEqual(w.lasers.length, 1, 'no rocket');
  assert.ok(!w.dog, 'no dog');
});

test('Sausage dog follows Man Ray and chases off a fish', function () {
  var w = MR.World.create(testLevel({ enemies: [{ type: 'fish', x: 600, y: 420, minX: 600, maxX: 600, speed: 0 }] }), { upgrades: { dog: true } });
  w.seenEnemyTypes.fish = true;
  assert.ok(w.dog);
  placePlayer(w, 380, 416);
  w.player.invuln = 1e9;
  for (var i = 0; i < 300 && w.enemies[0].alive; i++) { w.player.x = 380; MR.World.step(w, {}); }
  assert.strictEqual(w.enemies[0].alive, false, 'chased off');
  for (var j = 0; j < 200; j++) { w.player.x = 380; MR.World.step(w, {}); }
  assert.ok(Math.abs(w.dog.x + w.dog.w / 2 - (w.player.x + w.player.w / 2)) < 120, 'comes back to Man Ray');
});

test('Sausage dog leaves the big helpers alone', function () {
  var w = MR.World.create(testLevel({ enemies: [{ type: 'booty', x: 600, y: 480, range: 10 }] }), { upgrades: { dog: true } });
  w.seenEnemyTypes.booty = true;
  placePlayer(w, 380, 416);
  for (var i = 0; i < 300; i++) { w.player.x = 380; MR.World.step(w, {}); }
  assert.ok(w.enemies[0].alive);
  assert.strictEqual(w.dog.state, 'follow');
});

console.log('Final level: Spiky and the God of the Zillas');

function finalLevel(extra) {
  var L = testLevel({
    width: 2400,
    solids: [{ kind: 'sand', x: 0, y: 480, w: 2400, h: 60 }],
    boss: { type: 'zillagod', x: 1600, minX: 1300, maxX: 1900, hp: 36, speed: 0.6, groundY: 480 },
    pickups: [{ type: 'bunny', x: 2200, y: 480, locked: true }]
  });
  for (var k in extra) L[k] = extra[k];
  return L;
}

test('Spiky waits to meet Man Ray, then joins him', function () {
  var w = MR.World.create(finalLevel({ ally: { type: 'spiky', x: 600, y: 480 } }));
  run(w, 30);
  assert.strictEqual(w.ally.state, 'wait');
  placePlayer(w, 520, 416);
  run(w, 1);
  assert.strictEqual(w.ally.state, 'follow');
  assert.ok(w.events.some(function (e) { return e.type === 'encounter' && e.enemy === 'spiky'; }), 'meeting tip');
  for (var i = 0; i < 300; i++) { w.player.x = 900; MR.World.step(w, {}); }
  assert.ok(Math.abs(w.ally.x + w.ally.w / 2 - (w.player.x + w.player.w / 2)) < 120, 'follows Man Ray');
});

test('Spiky shoots spikes that defeat nearby helpers', function () {
  var w = MR.World.create(finalLevel({
    ally: { type: 'spiky', x: 200, y: 480 },
    enemies: [{ type: 'fish', x: 480, y: 330, minX: 480, maxX: 480, speed: 0 }],
    boss: null
  }));
  w.seenEnemyTypes.fish = true;
  w.player.invuln = 1e9;
  for (var i = 0; i < 400 && w.enemies[0].alive; i++) { w.player.x = i < 5 ? 150 : 300; MR.World.step(w, {}); }
  assert.strictEqual(w.enemies[0].alive, false);
});

test("Spiky can't be hurt and helps fight the boss", function () {
  var w = MR.World.create(finalLevel({ ally: { type: 'spiky', x: 1150, y: 480 } }));
  w.boss.active = true; w.boss.attackTimer = 1e9;
  w.player.invuln = 1e9;
  for (var i = 0; i < 600; i++) { w.player.x = 1100; w.player.y = 200; MR.World.step(w, {}); }
  assert.ok(w.boss.hp < w.boss.maxHp, 'spikes hit the God of the Zillas');
});

test('the God of the Zillas stands on the seabed and can be zapped from it', function () {
  var w = MR.World.create(finalLevel());
  var b = w.boss;
  assert.ok(Math.abs(b.y - (480 - MR.Boss.GOD.STAND_ABOVE_GROUND)) < 1e-6);
  placePlayer(w, 1150, 416);
  run(w, 60);
  b.active = true; b.attackTimer = 1e9; b.speed = 0;
  run(w, 1, { firePressed: true });
  run(w, 60);
  assert.strictEqual(b.hp, b.maxHp - 1);
});

test('his fire breath warns first (glowing mouth), then 3 fireballs come', function () {
  var w = MR.World.create(finalLevel());
  var b = w.boss;
  b.active = true; b.attackTimer = 1; b.attackIndex = 0;
  run(w, 1);
  assert.strictEqual(b.state, 'inhale');
  run(w, MR.Boss.GOD.INHALE_TICKS - 2);
  assert.strictEqual(w.fireballs.length, 0, 'nothing during the warning');
  run(w, MR.Boss.GOD.BREATHE_TICKS + 4);
  assert.strictEqual(w.fireballs.length, 3);
  assert.ok(w.fireballs.every(function (f) { return f.vx < 0; }), 'toward Man Ray');
});

test('fireballs can be zapped, and hurt if they touch', function () {
  var w = MR.World.create(finalLevel());
  run(w, 60);
  w.fireballs.push({ x: 400, y: w.player.y + w.player.h / 2 + 6 - 14, w: 28, h: 28, vx: -1, vy: 0, life: 300 });
  run(w, 1, { firePressed: true });
  run(w, 30);
  assert.strictEqual(w.fireballs.length, 0, 'zapped');
  assert.strictEqual(w.player.hearts, 3);
  w.fireballs.push({ x: w.player.x + 10, y: w.player.y + 10, w: 28, h: 28, vx: 0, vy: 0, life: 300 });
  run(w, 1);
  assert.strictEqual(w.player.hearts, 2, 'burned');
});

test('his stomp sends shockwaves both ways along the seabed, to flap over', function () {
  var w = MR.World.create(finalLevel());
  var b = w.boss;
  b.active = true; b.attackTimer = 1; b.attackIndex = 1;
  run(w, 1);
  assert.strictEqual(b.state, 'crouch', 'crouches first as a warning');
  for (var i = 0; i < 200 && w.waves.length === 0; i++) MR.World.step(w, {});
  assert.strictEqual(w.waves.length, 2);
  assert.ok(w.waves[0].vx * w.waves[1].vx < 0, 'one each way');
  assert.ok(w.waves.every(function (wv) { return wv.y + wv.h === 480; }), 'along the seabed');
  assert.strictEqual(b.y, b.baseY, 'landed');
});

test('when angry he roars and calls in Zilla-fish (but not too many)', function () {
  var w = MR.World.create(finalLevel());
  var b = w.boss;
  b.active = true; b.hp = Math.floor(b.maxHp / 2);
  for (var k = 0; k < 4; k++) {
    b.state = 'fly'; b.attackTimer = 1; b.attackIndex = 2;
    run(w, 1 + MR.Boss.GOD.ROAR_TICKS + 1);
  }
  var summoned = w.enemies.filter(function (e) { return e.summoned; }).length;
  assert.ok(summoned >= 2 && summoned <= MR.Boss.GOD.MAX_SUMMONED, summoned + ' fish');
});

test('4 Bunny stays locked in his cage until the God of the Zillas is beaten', function () {
  var w = MR.World.create(finalLevel());
  var cage = w.pickups[0];
  placePlayer(w, 2180, 416);
  run(w, 3);
  assert.ok(!w.complete, 'locked');
  w.boss.hp = 1; w.boss.alive = true; w.boss.active = true; w.boss.attackTimer = 1e9; w.boss.speed = 0;
  w.boss.x = 900; w.boss.y = w.boss.baseY;
  placePlayer(w, 700, 416);
  run(w, 60);
  run(w, 1, { firePressed: true });
  run(w, 60);
  assert.strictEqual(w.boss.alive, false);
  assert.ok(!cage.locked, 'set free');
  placePlayer(w, 2180, 416);
  run(w, 2);
  assert.ok(w.complete && w.rescued, 'rescued!');
});

console.log('Ending');

test('the ending celebrates, rolls the credits, then says The End', function () {
  var e = MR.Ending.create();
  var sounds = [];
  for (var i = 0; i < MR.Ending.CELEBRATE_TICKS + 1; i++) sounds = sounds.concat(MR.Ending.update(e, {}));
  assert.strictEqual(e.phase, 'credits');
  for (var j = 0; j < 5000 && e.phase === 'credits'; j++) MR.Ending.update(e, {});
  assert.strictEqual(e.phase, 'end');
  for (var k = 0; k < 500; k++) MR.Ending.update(e, {});
  assert.ok(!e.done, 'waits on The End');
  MR.Ending.update(e, { next: true });
  assert.ok(e.done);
  assert.ok(sounds.indexOf('complete') >= 0);
});

test('SPACE skips ahead through the ending', function () {
  var e = MR.Ending.create();
  for (var i = 0; i < 50; i++) MR.Ending.update(e, {});
  MR.Ending.update(e, { next: true });
  assert.strictEqual(e.phase, 'credits');
  for (var j = 0; j < 50; j++) MR.Ending.update(e, {});
  MR.Ending.update(e, { next: true });
  assert.strictEqual(e.phase, 'end');
});

test('the credits say the game is by Benjamin Leonard-Williams and list everyone', function () {
  assert.strictEqual(MR.Ending.CREATOR, 'Benjamin Leonard-Williams');
  assert.strictEqual(MR.Ending.ARTISTS, 'Ben & Seb Leonard-Williams', 'characters drawn by');
  var names = MR.Ending.CAST.map(function (c) { return c.name; }).join(', ');
  ['Man Ray', '4 Bunny', 'Spiky', 'Gerald', 'The God of the Zillas', 'Octo-Pie', 'Tri-Terror', 'Booty', 'Bee Bot', 'The Instructor']
    .forEach(function (n) { assert.ok(names.indexOf(n) >= 0, n); });
});

console.log('Touch screens and game controllers');

test('a touch button holds a key down, and counts as one press', function () {
  var I = MR.Input;
  I.endStep();
  I.setSource('touch', 'ArrowLeft', true);
  assert.ok(I.isDown('ArrowLeft'));
  assert.ok(I.wasPressed('ArrowLeft'), 'just pressed');
  I.endStep();
  I.setSource('touch', 'ArrowLeft', true);
  assert.ok(!I.wasPressed('ArrowLeft'), 'holding is not a new press');
  I.setSource('touch', 'ArrowLeft', false);
  assert.ok(!I.isDown('ArrowLeft'));
});

test('touch and controller can hold the same key without fighting', function () {
  var I = MR.Input;
  I.endStep();
  I.setSource('touch', 'Space', true);
  I.setSource('pad', 'Space', true);
  I.setSource('touch', 'Space', false);
  assert.ok(I.isDown('Space'), 'still held by the controller');
  I.setSource('pad', 'Space', false);
  assert.ok(!I.isDown('Space'));
});

test('controller buttons map to the game keys', function () {
  function pad(pressedButtons, axes) {
    var buttons = [];
    for (var i = 0; i < 17; i++) buttons.push({ pressed: pressedButtons.indexOf(i) >= 0 });
    return { buttons: buttons, axes: axes || [0, 0] };
  }
  function keys(p) { var now = {}; MR.Input.readPad(p, now); return Object.keys(now).sort().join(','); }
  assert.strictEqual(keys(pad([14])), 'ArrowLeft', 'd-pad left');
  assert.strictEqual(keys(pad([], [0.9, 0])), 'ArrowRight', 'stick right');
  assert.strictEqual(keys(pad([0])), 'ArrowUp,Enter', 'A flaps (and OKs menus)');
  assert.strictEqual(keys(pad([2])), 'Space', 'X zaps');
  assert.strictEqual(keys(pad([3])), 'KeyR', 'Y fires a rocket');
  assert.strictEqual(keys(pad([9])), 'KeyP', 'Start pauses');
  assert.strictEqual(keys(pad([], [0.2, 0.1])), '', 'a resting stick does nothing');
});

test('touch buttons cover every control the game needs', function () {
  var src = fs.readFileSync(path.join(ROOT, 'js/touch.js'), 'utf8');
  ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyR', 'KeyP', 'KeyM'].forEach(function (code) {
    assert.ok(src.indexOf("code: '" + code + "'") >= 0, code);
  });
});

test('every page the game needs is published (manifest, icons, scripts)', function () {
  var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  var refs = (html.match(/(src|href)="([^"]+)"/g) || []).map(function (m) { return m.split('"')[1]; });
  refs.forEach(function (f) { assert.ok(fs.existsSync(path.join(ROOT, f)), 'missing ' + f); });
  var manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  manifest.icons.forEach(function (ic) { assert.ok(fs.existsSync(path.join(ROOT, ic.src)), 'missing ' + ic.src); });
});

console.log('Story intro');

function playIntro(intro, ticks, input) {
  var sounds = [];
  for (var i = 0; i < ticks && !intro.done; i++) sounds = sounds.concat(MR.Intro.update(intro, input || {}));
  return sounds;
}

test('the story has 5 scenes that move on by themselves', function () {
  var intro = MR.Intro.create();
  assert.strictEqual(MR.Intro.SCENES.length, 5);
  var autoTicks = MR.Intro.SCENES.slice(0, 4).reduce(function (a, sc) { return a + sc.ticks; }, 0);
  playIntro(intro, autoTicks);
  assert.strictEqual(intro.scene, 4, 'reached the last scene');
});

test('the last scene waits for SPACE', function () {
  var intro = MR.Intro.create();
  playIntro(intro, 5000);
  assert.ok(!intro.done, 'still waiting');
  playIntro(intro, 1, { next: true });
  assert.ok(intro.done);
});

test('SPACE moves to the next scene, but not by accident in its first moments', function () {
  var intro = MR.Intro.create();
  playIntro(intro, 1, { next: true });
  assert.strictEqual(intro.scene, 0, 'too soon');
  playIntro(intro, 30);
  playIntro(intro, 1, { next: true });
  assert.strictEqual(intro.scene, 1);
});

test('S skips the whole story', function () {
  var intro = MR.Intro.create();
  playIntro(intro, 50);
  playIntro(intro, 1, { skip: true });
  assert.ok(intro.done);
});

test('the story plays its sounds', function () {
  var intro = MR.Intro.create();
  var sounds = playIntro(intro, 2000);
  ['rumble', 'whoosh', 'chime'].forEach(function (s) { assert.ok(sounds.indexOf(s) >= 0, s); });
});

test('the dropped carrot lands where Man Ray can swim to it', function () {
  var intro = MR.Intro.create();
  playIntro(intro, 300 + 220 + 260 + 220);
  assert.strictEqual(intro.scene, 4);
  assert.ok(intro.carrotX > 450 && intro.carrotX < 860, 'carrot at ' + intro.carrotX);
});

console.log('Levels');

test('there are 5 levels in order, each with a theme and clue', function () {
  assert.strictEqual(MR.LevelOrder.length, 5);
  MR.LevelOrder.forEach(function (L, i) {
    assert.strictEqual(L.number, i + 1);
    assert.ok(L.theme && L.clue && L.clue.title && L.tips.intro.length > 0, L.name);
  });
  assert.ok(!MR.LevelOrder[0].boss, 'Coral Cove has no boss now');
  assert.strictEqual(MR.LevelOrder[2].boss.type, 'octopie', 'Octo-Pie guards the Deep Trench');
  assert.strictEqual(MR.LevelOrder[3].boss.type, 'triterror', 'Tri-Terror guards Lava Lagoon');
  assert.strictEqual(MR.LevelOrder[4].boss.type, 'zillagod', 'the God of the Zillas guards the final level');
  assert.ok(MR.LevelOrder[4].final && MR.LevelOrder[4].ally, 'final level, with Spiky');
  assert.ok(MR.LevelOrder.slice(0, 4).every(function (L) { return !L.final; }));
});

test('every helper in every level has a first-meeting tip', function () {
  MR.LevelOrder.forEach(function (L) {
    L.enemies.concat(L.boss ? [L.boss] : [], L.hazards || []).forEach(function (e) {
      assert.ok(MR.EncounterTips[e.type], L.name + ': ' + e.type);
    });
  });
});

test('first-meeting tips carry over between levels', function () {
  var seen = {};
  var w1 = MR.World.create(MR.LevelOrder[0], { seenEnemyTypes: seen });
  w1.seenEnemyTypes.fish = true;
  var w2 = MR.World.create(MR.LevelOrder[1], { seenEnemyTypes: seen });
  assert.ok(w2.seenEnemyTypes.fish);
});

MR.LevelOrder.forEach(function (L) {
  test(L.name + ': level data is sensible', function () {
    var w = MR.World.create(L);
    assert.ok(!MR.Physics.overlapsAny(w.player, w.solids), 'start is not inside a rock');
    w.pickups.forEach(function (pk) {
      assert.ok(!MR.Physics.overlapsAny(MR.Physics.shrink(pk, 4), w.solids), pk.type + ' at ' + pk.cx + ' is reachable');
      assert.ok(pk.x >= 0 && pk.x + pk.w <= L.width && pk.y >= L.waterTop);
    });
    w.enemies.forEach(function (e) {
      assert.ok(!MR.Physics.overlapsAny(e, w.solids), e.type + ' at ' + e.x + ' starts in open water');
      assert.ok(MR.Enemies.TYPES[e.type], 'known enemy ' + e.type);
    });
    w.solids.forEach(function (s) {
      assert.ok(s.x >= 0 && s.x + s.w <= L.width, s.kind + ' at ' + s.x + ' inside the level');
    });
    assert.strictEqual(w.pickups.filter(function (p) { return p.type === 'clam'; }).length, 2);
    assert.strictEqual(w.pickups.filter(function (p) { return p.type === 'carrot' || p.type === 'bunny'; }).length, 1, 'one goal');
    var guarded = w.pickups.filter(function (p) { return p.hidden || p.locked; }).length;
    assert.strictEqual(guarded > 0, !!L.boss, 'the goal is guarded only when there is a boss');
    assert.ok(MR.Themes[L.theme], 'known theme ' + L.theme);
    assert.ok(L.width >= 960 * 6 && L.width <= 960 * 7.5);
  });

  test('a simple robot player can finish ' + L.name, function () {
    var w = MR.World.create(L);
    var p = w.player;
    for (var i = 0; i < 20000 && !w.complete; i++) {
      var wallAhead = MR.Physics.pointInSolid(p.x + p.w + 24, p.y + p.h - 4, w.solids);
      var b = w.boss;
      var bossBehind = b && b.alive && b.active && b.x + b.w / 2 < p.x + p.w / 2;
      MR.World.step(w, {
        right: !bossBehind,
        left: bossBehind,
        fireHeld: true,
        flapPressed: wallAhead && i % 16 === 0,
        flapHeld: wallAhead
      });
    }
    if (w.boss) assert.ok(!w.boss.alive, 'beat ' + w.boss.name);
    assert.ok(w.complete, 'reached the carrot (stuck at x=' + Math.round(p.x) + ')');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
