var MR = MR || {};

// Pearls, heart bubbles, clam checkpoints, golden pearls, 4 Bunny's carrot,
// and 4 Bunny himself (locked in a cage until the final boss is beaten).
//   pearl / heart: { type, x, y } — x/y is the centre.
//   clam / carrot / bunny: { type, x, y } — x is the centre, y is the ground.
//   locked: true keeps a pickup shut away until the level's boss is beaten.
// Opening a clam releases a golden pearl that floats up out of it; catching
// it is worth GOLDEN_VALUE pearls.
MR.Pickups = (function () {
  var GOLDEN_VALUE = 5;
  var GOLDEN_RISE_TICKS = 40;
  var GOLDEN_HEIGHT = 95;

  function create(def) {
    // hidden: true keeps a pickup invisible until the level's boss is beaten.
    var pk = { type: def.type, cx: def.x, cy: def.y, collected: false, hidden: !!def.hidden, locked: !!def.locked };
    switch (def.type) {
      case 'pearl':
        setBox(pk, def.x - 13, def.y - 13, 26, 26);
        break;
      case 'heart':
        setBox(pk, def.x - 18, def.y - 18, 36, 36);
        break;
      case 'golden':
        // Starts inside the clam (def.fromY) and rises to (x, y).
        pk.fromY = def.fromY === undefined ? def.y : def.fromY;
        pk.rise = def.fromY === undefined ? 0 : GOLDEN_RISE_TICKS;
        // A generous catch area so it's easy for little swimmers to grab.
        setBox(pk, def.x - 24, def.y - 24, 48, 48);
        break;
      case 'clam':
        pk.groundY = def.y;
        pk.open = false;
        setBox(pk, def.x - 32, def.y - 40, 64, 40);
        break;
      case 'carrot':
        pk.groundY = def.y;
        setBox(pk, def.x - 24, def.y - 76, 48, 76);
        break;
      case 'bunny':
        pk.groundY = def.y;
        setBox(pk, def.x - 40, def.y - 120, 80, 120);
        break;
    }
    return pk;
  }

  function setBox(pk, x, y, w, h) {
    pk.x = x; pk.y = y; pk.w = w; pk.h = h;
  }

  // Where a rising golden pearl is drawn right now.
  function goldenDrawY(pk) {
    var k = 1 - pk.rise / GOLDEN_RISE_TICKS;
    var ease = 1 - (1 - k) * (1 - k);
    return pk.fromY + (pk.cy - pk.fromY) * ease;
  }

  function update(pk) {
    if (pk.type === 'golden' && pk.rise > 0) pk.rise--;
  }

  // Applies the pickup's effect. Returns a sound/event name, or null if
  // nothing happened (e.g. heart bubble while already at full hearts).
  function collect(pk, world) {
    var p = world.player;
    switch (pk.type) {
      case 'pearl':
        pk.collected = true;
        world.pearls++;
        return 'pling';
      case 'heart':
        if (!MR.Player.heal(p)) return null;
        pk.collected = true;
        return 'heart';
      case 'golden':
        if (pk.rise > 0) return null;
        pk.collected = true;
        world.pearls += GOLDEN_VALUE;
        world.golden++;
        return 'golden';
      case 'clam':
        if (pk.open) return null;
        pk.open = true;
        world.checkpoint = { x: pk.cx - p.w / 2, y: pk.groundY - p.h - 1 };
        world.pickups.push(create({
          type: 'golden', x: pk.cx, y: pk.groundY - GOLDEN_HEIGHT, fromY: pk.groundY - 18
        }));
        return 'chime';
      case 'carrot':
        world.complete = true;
        return 'complete';
      case 'bunny':
        if (pk.locked) return null;
        world.complete = true;
        world.rescued = true;
        return 'complete';
    }
    return null;
  }

  return {
    GOLDEN_VALUE: GOLDEN_VALUE, GOLDEN_RISE_TICKS: GOLDEN_RISE_TICKS, GOLDEN_HEIGHT: GOLDEN_HEIGHT,
    create: create, update: update, collect: collect, goldenDrawY: goldenDrawY
  };
})();
