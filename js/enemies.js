var MR = MR || {};

// The God of the Zillas' helpers.
//   fish:  { type: 'fish', x, y, minX, maxX, speed }  — x/y is the centre,
//          swims between minX and maxX (centre positions).
//   crab:  { type: 'crab', x, y, speed } — x is the centre, y is the ground
//          it stands on. Turns at walls and platform edges.
//   booty: { type: 'booty', x, y, minX, maxX, range } — an old boot come
//          alive. x is the centre, y is the ground. When Man Ray comes
//          within `range` he crouches (a warning), then jumps to stamp
//          where Man Ray is, staying between minX and maxX. Rests after
//          each landing.
//   beebot: { type: 'beebot', x, y, minX, maxX, minY, maxY, range } — an
//          evil robotic bee. x/y is the centre (his home). When Man Ray is
//          within `range` he lines up beside him, turns his pointy bum
//          toward him (a warning: stinger glows, he buzzes), then dashes
//          bum-first in a straight line. Rests, then tries again. Stays
//          inside minX..maxX and minY..maxY (centre positions).
MR.Enemies = (function () {
  var TYPES = {
    fish: { w: 52, h: 34, hp: 1 },
    crab: { w: 50, h: 32, hp: 2 },
    booty: { w: 56, h: 64, hp: 3 },
    beebot: { w: 56, h: 40, hp: 2 }
  };
  var FLASH_TICKS = 14;
  var CRAB_GRAVITY = 0.3;
  var BOOTY = {
    GRAVITY: 0.22, JUMP_SPEED: 7.5, MAX_VX: 3,
    WINDUP_TICKS: 45, REST_TICKS: 90, RANGE: 300
  };
  var BOOTY_FLIGHT_TICKS = 2 * BOOTY.JUMP_SPEED / BOOTY.GRAVITY;
  var BEEBOT = {
    SPEED: 1.3, SIDE_GAP: 150, RANGE: 340,
    HOVER_TICKS: 80, AIM_TICKS: 40, DASH_SPEED: 6, DASH_TICKS: 45, RECOVER_TICKS: 70
  };

  function create(def) {
    var t = TYPES[def.type];
    var e = {
      type: def.type, w: t.w, h: t.h, hp: t.hp, maxHp: t.hp,
      alive: true, flash: 0, frame: 0,
      speed: def.speed === undefined ? 1 : def.speed, dir: def.dir || 1, vx: 0, vy: 0
    };
    e.x = def.x - t.w / 2;
    if (def.type === 'fish' || def.type === 'beebot') {
      e.y = def.y - t.h / 2;
      e.baseY = e.y;
      e.minX = def.minX;
      e.maxX = def.maxX;
    } else {
      e.y = def.y - t.h;
    }
    if (def.type === 'booty') {
      e.state = 'idle';
      e.timer = 0;
      e.dir = -1;
      e.minX = def.minX === undefined ? def.x : def.minX;
      e.maxX = def.maxX === undefined ? def.x : def.maxX;
      e.range = def.range || BOOTY.RANGE;
      e.groundY = def.y;
      e.jumpVx = 0;
    }
    if (def.type === 'beebot') {
      e.state = 'hover';
      e.timer = 0;
      e.dir = -1;
      e.homeX = def.x;
      e.homeY = def.y;
      e.minY = def.minY === undefined ? def.y - 150 : def.minY;
      e.maxY = def.maxY === undefined ? def.y + 150 : def.maxY;
      e.range = def.range || BEEBOT.RANGE;
      e.dashVx = 0;
      e.dashVy = 0;
    }
    return e;
  }

  function update(e, world) {
    if (!e.alive) return;
    e.frame++;
    if (e.flash > 0) e.flash--;
    if (e.type === 'fish') updateFish(e);
    else if (e.type === 'booty') updateBooty(e, world);
    else if (e.type === 'beebot') updateBeeBot(e, world);
    else updateCrab(e, world);
  }

  function updateFish(e) {
    e.x += e.dir * e.speed;
    var cx = e.x + e.w / 2;
    if (cx >= e.maxX) { e.x = e.maxX - e.w / 2; e.dir = -1; }
    if (cx <= e.minX) { e.x = e.minX - e.w / 2; e.dir = 1; }
    e.y = e.baseY + Math.sin(e.frame * 0.05) * 6;
  }

  function updateCrab(e, world) {
    e.vx = e.dir * e.speed;
    e.vy = Math.min(e.vy + CRAB_GRAVITY, 6);
    var hit = MR.Physics.moveAndCollide(e, world.solids);
    if (hit.hitX) {
      e.dir = -e.dir;
    } else if (hit.onGround) {
      var aheadX = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
      if (!MR.Physics.pointInSolid(aheadX, e.y + e.h + 2, world.solids)) e.dir = -e.dir;
    }
    if (e.x < 0) { e.x = 0; e.dir = 1; }
    if (e.x + e.w > world.width) { e.x = world.width - e.w; e.dir = -1; }
  }

  function updateBooty(e, world) {
    var p = world.player;
    var cx = e.x + e.w / 2;
    var pcx = p.x + p.w / 2;

    e.vx = e.state === 'jump' ? e.jumpVx : 0;
    e.vy = Math.min(e.vy + BOOTY.GRAVITY, 8);
    var hit = MR.Physics.moveAndCollide(e, world.solids);
    if (hit.hitX) e.jumpVx = 0;

    // Stay on his own patch of seabed.
    if (e.x + e.w / 2 < e.minX) { e.x = e.minX - e.w / 2; e.jumpVx = 0; }
    if (e.x + e.w / 2 > e.maxX) { e.x = e.maxX - e.w / 2; e.jumpVx = 0; }

    if (e.state === 'idle') {
      if (e.timer > 0) e.timer--;
      if (Math.abs(pcx - cx) < e.range) e.dir = pcx < cx ? -1 : 1;
      if (e.timer <= 0 && hit.onGround && Math.abs(pcx - cx) < e.range) {
        e.state = 'windup';
        e.timer = BOOTY.WINDUP_TICKS;
      }
    } else if (e.state === 'windup') {
      e.dir = pcx < cx ? -1 : 1;
      e.timer--;
      if (e.timer <= 0) {
        var target = Math.max(e.minX, Math.min(e.maxX, pcx));
        e.jumpVx = Math.max(-BOOTY.MAX_VX, Math.min(BOOTY.MAX_VX, (target - cx) / BOOTY_FLIGHT_TICKS));
        e.vy = -BOOTY.JUMP_SPEED;
        e.groundY = e.y + e.h;
        e.state = 'jump';
        world.events.push({ type: 'boing' });
      }
    } else if (e.state === 'jump') {
      if (hit.onGround) {
        e.state = 'idle';
        e.timer = BOOTY.REST_TICKS;
        e.jumpVx = 0;
        world.events.push({ type: 'stomp' });
      }
    }
  }

  function moveToward(e, tx, ty, speed) {
    var dx = tx - (e.x + e.w / 2), dy = ty - (e.y + e.h / 2);
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < speed) { e.vx = dx; e.vy = dy; } else { e.vx = dx / d * speed; e.vy = dy / d * speed; }
  }

  function updateBeeBot(e, world) {
    var p = world.player;
    var cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    var pcx = p.x + p.w / 2, pcy = p.y + p.h / 2;
    var near = Math.abs(pcx - cx) < e.range && Math.abs(pcy - cy) < e.range;
    var hit;

    if (e.state === 'hover') {
      if (near) {
        var side = cx < pcx ? -1 : 1;
        moveToward(e, pcx + side * BEEBOT.SIDE_GAP, pcy - 10, BEEBOT.SPEED);
        e.dir = pcx < cx ? -1 : 1;
        e.timer++;
        if (e.timer > BEEBOT.HOVER_TICKS) {
          e.state = 'aim';
          e.timer = BEEBOT.AIM_TICKS;
          e.dir = -e.dir;
          world.events.push({ type: 'buzz' });
        }
      } else {
        moveToward(e, e.homeX, e.homeY + Math.sin(e.frame * 0.05) * 20, BEEBOT.SPEED * 0.6);
        if (e.vx !== 0) e.dir = e.vx < 0 ? -1 : 1;
        e.timer = 0;
      }
    } else if (e.state === 'aim') {
      // Bum toward Man Ray: he faces away from him.
      e.vx = 0; e.vy = 0;
      e.dir = pcx < cx ? 1 : -1;
      e.timer--;
      if (e.timer <= 0) {
        var dx = pcx - cx, dy = pcy - cy;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        e.dashVx = dx / d * BEEBOT.DASH_SPEED;
        e.dashVy = dy / d * BEEBOT.DASH_SPEED;
        e.state = 'sting';
        e.timer = BEEBOT.DASH_TICKS;
        world.events.push({ type: 'whoosh' });
      }
    } else if (e.state === 'sting') {
      e.vx = e.dashVx; e.vy = e.dashVy;
    } else if (e.state === 'recover') {
      moveToward(e, e.homeX, e.homeY, BEEBOT.SPEED * 0.8);
      if (e.vx !== 0) e.dir = e.vx < 0 ? -1 : 1;
      e.timer--;
      if (e.timer <= 0) { e.state = 'hover'; e.timer = 0; }
    }

    hit = MR.Physics.moveAndCollide(e, world.solids);
    var leashed = clampBeeBot(e, world);
    if (e.state === 'sting') {
      e.timer--;
      if (hit.hitX || hit.hitY || leashed || e.timer <= 0) {
        e.state = 'recover';
        e.timer = BEEBOT.RECOVER_TICKS;
      }
    }
  }

  // Keeps Bee Bot inside his patch. Returns true if he hit the edge.
  function clampBeeBot(e, world) {
    var hitEdge = false;
    var minCy = Math.max(e.minY, world.waterTop + e.h / 2);
    if (e.x + e.w / 2 < e.minX) { e.x = e.minX - e.w / 2; hitEdge = true; }
    if (e.x + e.w / 2 > e.maxX) { e.x = e.maxX - e.w / 2; hitEdge = true; }
    if (e.y + e.h / 2 < minCy) { e.y = minCy - e.h / 2; hitEdge = true; }
    if (e.y + e.h / 2 > e.maxY) { e.y = e.maxY - e.h / 2; hitEdge = true; }
    return hitEdge;
  }

  // Returns true when this hit defeats the enemy.
  function hit(e) {
    if (!e.alive) return false;
    e.hp--;
    e.flash = FLASH_TICKS;
    if (e.hp <= 0) e.alive = false;
    return !e.alive;
  }

  return { TYPES: TYPES, BOOTY: BOOTY, BEEBOT: BEEBOT, create: create, update: update, hit: hit };
})();
