var MR = MR || {};

// Spiky, the spiky bird who is Man Ray's friend (Level 5).
//   level.ally: { type: 'spiky', x, y } — x is the centre, y is the ground.
// He waits there, waving, until Man Ray swims up to him (that's when they
// meet). Then he flies along beside Man Ray and shoots spikes at nearby
// enemies, and at the God of the Zillas. He can't be hurt.
MR.Ally = (function () {
  var SPIKY = {
    w: 50, h: 70, MEET_DISTANCE: 170, EASE: 0.06,
    COOLDOWN: 130, BOSS_COOLDOWN: 170, RANGE: 380, BOSS_RANGE: 650,
    SPIKES: 3, SPREAD: 0.18, SPIKE_SPEED: 6, SPIKE_SIZE: 14, SPIKE_LIFE: 100
  };

  function create(def) {
    return {
      type: def.type,
      x: def.x - SPIKY.w / 2, y: def.y - SPIKY.h - 22,
      w: SPIKY.w, h: SPIKY.h,
      state: 'wait', facing: -1, frame: 0, cooldown: 60, shootAnim: 0
    };
  }

  function update(a, world) {
    var p = world.player;
    var pcx = p.x + p.w / 2, pcy = p.y + p.h / 2;
    var cx = a.x + a.w / 2, cy = a.y + a.h / 2;
    a.frame++;
    if (a.shootAnim > 0) a.shootAnim--;

    if (a.state === 'wait') {
      a.facing = pcx < cx ? -1 : 1;
      if (Math.abs(pcx - cx) < SPIKY.MEET_DISTANCE && Math.abs(pcy - cy) < 200) {
        a.state = 'follow';
        world.events.push({ type: 'encounter', enemy: 'spiky' });
        world.events.push({ type: 'chime' });
      }
      return;
    }

    // Fly beside Man Ray, a little above and behind.
    var tx = pcx - p.facing * 64, ty = p.y - 30 + Math.sin(a.frame * 0.06) * 8;
    a.x += (tx - cx) * SPIKY.EASE;
    a.y += (ty - cy) * SPIKY.EASE;
    a.y = Math.max(world.waterTop, a.y);

    if (a.cooldown > 0) { a.cooldown--; return; }
    var target = pickTarget(a, world);
    if (!target) { a.facing = p.facing; return; }
    var t = target.box;
    a.facing = t.x + t.w / 2 < cx ? -1 : 1;
    shoot(a, world, t.x + t.w / 2, t.y + t.h / 2);
    a.cooldown = target.boss ? SPIKY.BOSS_COOLDOWN : SPIKY.COOLDOWN;
  }

  // The boss if he's awake and near, otherwise the nearest helper.
  function pickTarget(a, world) {
    var cx = a.x + a.w / 2, cy = a.y + a.h / 2;
    var b = world.boss;
    if (b && b.alive && b.active && Math.abs(b.x + b.w / 2 - cx) < SPIKY.BOSS_RANGE) return { box: b, boss: true };
    var best = null, bestDist = SPIKY.RANGE;
    world.enemies.forEach(function (e) {
      if (!e.alive) return;
      var d = Math.abs(e.x + e.w / 2 - cx) + Math.abs(e.y + e.h / 2 - cy) * 0.5;
      if (d < bestDist) { best = e; bestDist = d; }
    });
    return best ? { box: best, boss: false } : null;
  }

  function shoot(a, world, tx, ty) {
    var cx = a.x + a.w / 2, cy = a.y + a.h / 2 - 10;
    var angle = Math.atan2(ty - cy, tx - cx);
    var s = SPIKY.SPIKE_SIZE;
    for (var i = 0; i < SPIKY.SPIKES; i++) {
      var ang = angle + (i - (SPIKY.SPIKES - 1) / 2) * SPIKY.SPREAD;
      world.spikes.push({
        x: cx - s / 2, y: cy - s / 2, w: s, h: s,
        vx: Math.cos(ang) * SPIKY.SPIKE_SPEED, vy: Math.sin(ang) * SPIKY.SPIKE_SPEED,
        life: SPIKY.SPIKE_LIFE
      });
    }
    a.shootAnim = 16;
    world.events.push({ type: 'spikes' });
  }

  return { SPIKY: SPIKY, create: create, update: update };
})();
