var MR = MR || {};

// Things in the scenery that hurt Man Ray.
//   volcano: { type: 'volcano', x, y, period, offset } — x is the centre,
//            y is the ground. Erupts on a steady rhythm: a quiet spell,
//            then a warning (crater glows, ground rumbles), then lava
//            shoots up out of the crater and lava blobs fly out. Touching
//            lava costs a heart. `offset` staggers neighbouring volcanoes.
MR.Hazards = (function () {
  var VOLCANO = {
    HALF_BASE: 95, H: 80, PERIOD: 330, WARN: 75, ERUPT: 110,
    LAVA_H: 240, LAVA_W: 32, BLOB_R: 9, BLOB_SPEED: 6.5, BLOB_GRAVITY: 0.16,
    NEAR: 650    // only volcanoes this close to the middle of the screen make noise
  };
  // How fast sideways each eruption's blobs fly (alternates eruption to
  // eruption). Kept gentle so they land close to the cone, about 100px out.
  var BLOB_SPREADS = [[-1.1, 0.7], [-0.7, 1.1]];

  function create(def) {
    var hz = {
      type: def.type,
      cx: def.x,
      groundY: def.y,
      craterY: def.y - VOLCANO.H,
      period: def.period || VOLCANO.PERIOD,
      offset: def.offset || 0,
      phase: 'idle',
      phaseTime: 0,
      eruptions: 0
    };
    hz.x = hz.cx - VOLCANO.HALF_BASE;
    hz.y = hz.craterY;
    hz.w = VOLCANO.HALF_BASE * 2;
    hz.h = VOLCANO.H;
    return hz;
  }

  // The volcano's cone is solid: a wide lower step and a narrow top.
  function solids(hz) {
    return [
      { kind: 'volcano', x: hz.cx - 70, y: hz.groundY - 50, w: 140, h: 50 },
      { kind: 'volcano', x: hz.cx - 38, y: hz.craterY, w: 76, h: 30 }
    ];
  }

  // Which part of its rhythm the volcano is in at this time.
  function phaseAt(hz, time) {
    var t = (time + hz.offset) % hz.period;
    var idle = hz.period - VOLCANO.WARN - VOLCANO.ERUPT;
    if (t < idle) return { phase: 'idle', t: t };
    if (t < idle + VOLCANO.WARN) return { phase: 'warn', t: t - idle };
    return { phase: 'erupt', t: t - idle - VOLCANO.WARN };
  }

  function update(hz, world) {
    var ph = phaseAt(hz, world.time);
    var near = Math.abs(hz.cx - (world.camera.x + 480)) < VOLCANO.NEAR;
    if (ph.phase !== hz.phase) {
      if (ph.phase === 'warn' && near) world.events.push({ type: 'rumble' });
      if (ph.phase === 'erupt') {
        spawnBlobs(hz, world);
        hz.eruptions++;
        if (near) world.events.push({ type: 'erupt' });
      }
    }
    hz.phase = ph.phase;
    hz.phaseTime = ph.t;
  }

  function spawnBlobs(hz, world) {
    var spread = BLOB_SPREADS[hz.eruptions % BLOB_SPREADS.length];
    spread.forEach(function (vx) {
      world.lavaBlobs.push({
        x: hz.cx - VOLCANO.BLOB_R, y: hz.craterY - 14 - VOLCANO.BLOB_R,
        w: VOLCANO.BLOB_R * 2, h: VOLCANO.BLOB_R * 2,
        vx: vx, vy: -VOLCANO.BLOB_SPEED, life: 240
      });
    });
  }

  function updateBlobs(world) {
    for (var i = world.lavaBlobs.length - 1; i >= 0; i--) {
      var b = world.lavaBlobs[i];
      b.vy += VOLCANO.BLOB_GRAVITY;
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      var falling = b.vy > 0;
      if (b.life <= 0 || b.y > world.height ||
          (falling && MR.Physics.overlapsAny(b, world.solids))) {
        world.lavaBlobs.splice(i, 1);
      }
    }
  }

  // How tall the lava column is right now (0 when not erupting). It shoots
  // up fast, holds, then sinks back.
  function lavaHeight(hz) {
    if (hz.phase !== 'erupt') return 0;
    var k = hz.phaseTime / VOLCANO.ERUPT;
    return VOLCANO.LAVA_H * Math.max(0, Math.min(1, k / 0.15, (1 - k) / 0.25));
  }

  // The part of the lava column that hurts, or null.
  function lavaRect(hz) {
    var h = lavaHeight(hz);
    if (h <= 0) return null;
    return { x: hz.cx - VOLCANO.LAVA_W / 2, y: hz.craterY - h, w: VOLCANO.LAVA_W, h: h };
  }

  return {
    VOLCANO: VOLCANO,
    create: create, solids: solids, phaseAt: phaseAt, update: update,
    updateBlobs: updateBlobs, lavaHeight: lavaHeight, lavaRect: lavaRect
  };
})();
