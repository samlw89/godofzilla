var MR = MR || {};

// Man Ray: floaty swimming, flapping, laser, hearts and respawn.
// Input is an abstract object so tests can drive it:
//   { left, right, flapPressed, flapHeld, firePressed, fireHeld,
//     rocketPressed, rocketHeld }
MR.Player = (function () {
  var C = {
    W: 44, H: 64,
    ACCEL: 0.32, MAX_SPEED: 3.6, FRICTION: 0.9,
    GRAVITY: 0.1, MAX_SINK: 2.0,
    FLAP: 3.0, MAX_RISE: 4.2, HOLD_FLAP_TICKS: 16, FLAP_ANIM_TICKS: 14,
    MAX_HEARTS: 3, INVULN_TICKS: 120, KNOCK_TICKS: 18, KNOCK_SPEED: 5,
    FIRE_COOLDOWN: 16, MAX_LASERS: 3, LASER_SPEED: 9, LASER_RANGE: 440,
    LASER_W: 26, LASER_H: 8,
    // Blaster muzzle, measured from the centre of his body, facing right.
    // MR.Art.drawManRay draws the blaster so its muzzle sits exactly here.
    GUN_X: 92, GUN_Y: 6,
    // Rocket Launcher upgrade: held across his chest like a bazooka, mouth
    // in front, fired with its own button. Rockets leave the mouth, then
    // dip down to fly along the laser line. Mouth measured the same way as
    // the blaster muzzle; ROCKET_SCALE is how big MR.Art draws it.
    ROCKET_X: 60, ROCKET_Y: -16, ROCKET_SCALE: 0.8, ROCKET_W: 26, ROCKET_H: 12, ROCKET_SPEED: 7,
    ROCKET_COOLDOWN: 40, MAX_ROCKETS: 2, ROCKET_DAMAGE: 2,
    // Mega Punch upgrade
    PUNCH_RANGE: 95, PUNCH_COOLDOWN: 36, PUNCH_ANIM_TICKS: 18, PUNCH_DAMAGE: 2
  };

  function create(start) {
    return {
      x: start.x, y: start.y, w: C.W, h: C.H, vx: 0, vy: 0,
      facing: 1, onGround: false,
      hearts: C.MAX_HEARTS, invuln: 0, knock: 0,
      fireCooldown: 0, holdTimer: 0, flapAnim: 0, frame: 0,
      punchCooldown: 0, punchAnim: 0, rocketCooldown: 0
    };
  }

  function update(p, input, world) {
    p.frame++;
    if (p.invuln > 0) p.invuln--;
    if (p.fireCooldown > 0) p.fireCooldown--;
    if (p.rocketCooldown > 0) p.rocketCooldown--;
    if (p.flapAnim > 0) p.flapAnim--;

    // Swim left / right with water drift.
    if (p.knock > 0) {
      p.knock--;
      p.vx *= 0.95;
    } else {
      if (input.left && !input.right) {
        p.vx -= C.ACCEL;
        p.facing = -1;
      } else if (input.right && !input.left) {
        p.vx += C.ACCEL;
        p.facing = 1;
      } else {
        p.vx *= C.FRICTION;
        if (Math.abs(p.vx) < 0.05) p.vx = 0;
      }
      if (p.vx > C.MAX_SPEED) p.vx = C.MAX_SPEED;
      if (p.vx < -C.MAX_SPEED) p.vx = -C.MAX_SPEED;
    }

    // Gentle sinking.
    p.vy += C.GRAVITY;
    if (p.vy > C.MAX_SINK) p.vy = C.MAX_SINK;

    // Flapping: tap for one flap, hold for a steady rhythm of flaps.
    var flap = false;
    if (input.flapPressed) {
      flap = true;
      p.holdTimer = 0;
    } else if (input.flapHeld) {
      p.holdTimer++;
      if (p.holdTimer >= C.HOLD_FLAP_TICKS) {
        flap = true;
        p.holdTimer = 0;
      }
    } else {
      p.holdTimer = 0;
    }
    if (flap) {
      p.vy = Math.max(Math.min(p.vy, 0) - C.FLAP, -C.MAX_RISE);
      p.flapAnim = C.FLAP_ANIM_TICKS;
      world.events.push({ type: 'flap' });
    }

    var hit = MR.Physics.moveAndCollide(p, world.solids);
    p.onGround = hit.onGround;

    // Level walls, water surface ceiling, and a floor safety net.
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    if (p.x + p.w > world.width) { p.x = world.width - p.w; p.vx = 0; }
    if (p.y < world.waterTop) { p.y = world.waterTop; if (p.vy < 0) p.vy = 0; }
    if (p.y + p.h > world.height) { p.y = world.height - p.h; p.vy = 0; p.onGround = true; }

    if ((input.firePressed || input.fireHeld) && p.fireCooldown <= 0 &&
        boltCount(world) < C.MAX_LASERS) {
      fire(p, world);
    }
    if (world.upgrades && world.upgrades.rocket && (input.rocketPressed || input.rocketHeld) &&
        p.rocketCooldown <= 0 && world.lasers.length - boltCount(world) < C.MAX_ROCKETS) {
      fireRocket(p, world);
    }
  }

  // Laser bolts on screen (rockets from the upgrade don't count).
  function boltCount(world) {
    var n = 0;
    for (var i = 0; i < world.lasers.length; i++) if (world.lasers[i].kind !== 'rocket') n++;
    return n;
  }

  function fire(p, world) {
    p.fireCooldown = C.FIRE_COOLDOWN;
    world.events.push({ type: 'zap' });
    var cx = p.x + p.w / 2;
    var muzzleX = cx + p.facing * C.GUN_X;
    var y = p.y + p.h / 2 + C.GUN_Y - C.LASER_H / 2;
    // If a rock sits between his body and the muzzle, the bolt fizzles
    // instead of appearing on the far side of it.
    var reach = { x: Math.min(cx, muzzleX), y: y, w: Math.abs(muzzleX - cx), h: C.LASER_H };
    if (MR.Physics.overlapsAny(reach, world.solids)) return;
    world.lasers.push({
      x: p.facing > 0 ? muzzleX : muzzleX - C.LASER_W,
      y: y,
      w: C.LASER_W, h: C.LASER_H,
      vx: p.facing * C.LASER_SPEED,
      dist: 0
    });
  }

  // Rocket Launcher upgrade: a rocket shoots out of the launcher's mouth.
  // It hits twice as hard as a laser bolt.
  function fireRocket(p, world) {
    p.rocketCooldown = C.ROCKET_COOLDOWN;
    world.events.push({ type: 'rocket' });
    var cx = p.x + p.w / 2;
    var mouthX = cx + p.facing * C.ROCKET_X;
    var y = p.y + p.h / 2 + C.ROCKET_Y - C.ROCKET_H / 2;
    var reach = { x: Math.min(cx, mouthX), y: y, w: Math.abs(mouthX - cx), h: C.ROCKET_H };
    if (MR.Physics.overlapsAny(reach, world.solids)) return;
    world.lasers.push({
      kind: 'rocket',
      x: p.facing > 0 ? mouthX : mouthX - C.ROCKET_W,
      y: y,
      targetY: p.y + p.h / 2 + C.GUN_Y - C.ROCKET_H / 2,
      w: C.ROCKET_W, h: C.ROCKET_H,
      vx: p.facing * C.ROCKET_SPEED,
      dist: 0
    });
  }

  // Returns true if the hit counted (false while invulnerable).
  function hurt(p, fromX) {
    if (p.invuln > 0) return false;
    p.hearts--;
    p.invuln = C.INVULN_TICKS;
    p.knock = C.KNOCK_TICKS;
    p.vx = (p.x + p.w / 2 < fromX ? -1 : 1) * C.KNOCK_SPEED;
    p.vy = -2.5;
    return true;
  }

  function heal(p) {
    if (p.hearts >= C.MAX_HEARTS) return false;
    p.hearts++;
    return true;
  }

  function respawn(p, point) {
    p.x = point.x;
    p.y = point.y;
    p.vx = 0;
    p.vy = 0;
    p.knock = 0;
    p.hearts = C.MAX_HEARTS;
    p.invuln = C.INVULN_TICKS;
  }

  return { C: C, create: create, update: update, hurt: hurt, heal: heal, respawn: respawn };
})();
