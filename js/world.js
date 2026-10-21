var MR = MR || {};

// One playing level: the rules that tie the player, lasers, enemies and
// pickups together. No drawing here, so it can be tested in Node.
// step() returns a list of events ({ type }) for sound and the Instructor.
MR.World = (function () {
  var VIEW_W = 960;
  var LOOK_AHEAD = 110;
  var CAMERA_EASE = 0.08;
  var ENCOUNTER_MARGIN = 60;

  // opts.seenEnemyTypes: share which helpers have already been explained
  // between levels (so each first-meeting tip shows once).
  // opts.upgrades: what Man Ray has bought at Gerald's Shop
  //   { rocket, punch, dog } (see js/shop.js).
  var DOG = { w: 56, h: 24, CHASE_RANGE: 320, SPEED: 4.5, COOLDOWN: 90, GIVE_UP: 520 };
  function create(level, opts) {
    var hazards = (level.hazards || []).map(function (d) { return MR.Hazards.create(d); });
    var w = {
      level: level,
      width: level.width,
      height: level.height,
      waterTop: level.waterTop,
      solids: level.solids.map(function (s) {
        return { kind: s.kind, x: s.x, y: s.y, w: s.w, h: s.h };
      }).concat([].concat.apply([], hazards.map(MR.Hazards.solids))),
      hazards: hazards,
      lavaBlobs: [],
      tornadoes: [],
      fireballs: [],
      waves: [],
      spikes: [],
      ally: level.ally ? MR.Ally.create(level.ally) : null,
      player: MR.Player.create(level.playerStart),
      enemies: level.enemies.map(function (d) { return MR.Enemies.create(d); }),
      pickups: level.pickups.map(function (d) { return MR.Pickups.create(d); }),
      boss: level.boss ? MR.Boss.create(level.boss) : null,
      pies: [],
      lasers: [],
      particles: [],
      events: [],
      pearls: 0,
      totalPearls: 0,
      golden: 0,
      totalGolden: 0,
      popups: [],
      checkpoint: { x: level.playerStart.x, y: level.playerStart.y },
      seenEnemyTypes: (opts && opts.seenEnemyTypes) || {},
      upgrades: (opts && opts.upgrades) || {},
      dog: null,
      complete: false,
      completeTimer: 0,
      time: 0,
      camera: { x: 0 }
    };
    if (w.upgrades.dog) {
      w.dog = { x: w.player.x - 60, y: w.player.y + 30, w: DOG.w, h: DOG.h, facing: 1,
        state: 'follow', target: null, cooldown: 0, frame: 0 };
    }
    // Each clam holds a golden pearl worth several pearls.
    w.totalGolden = w.pickups.filter(function (pk) { return pk.type === 'clam'; }).length;
    w.totalPearls = w.pickups.filter(function (pk) { return pk.type === 'pearl'; }).length +
      w.totalGolden * MR.Pickups.GOLDEN_VALUE;
    snapCamera(w);
    return w;
  }

  function step(w, input) {
    w.events = [];
    w.time++;
    updateParticles(w);
    if (w.complete) {
      w.completeTimer++;
      return w.events;
    }

    MR.Player.update(w.player, input, w);
    if (hasEvent(w, 'flap')) finBubbles(w);
    updateLasers(w);
    if (w.upgrades.punch) updatePunch(w);
    if (w.dog) updateDog(w);
    for (var i = 0; i < w.enemies.length; i++) MR.Enemies.update(w.enemies[i], w);
    if (w.boss) MR.Boss.update(w.boss, w);
    MR.Boss.updatePies(w);
    MR.Boss.updateTornadoes(w);
    MR.Boss.updateGodAttacks(w);
    if (w.ally) MR.Ally.update(w.ally, w);
    updateSpikes(w);
    for (var h = 0; h < w.hazards.length; h++) MR.Hazards.update(w.hazards[h], w);
    MR.Hazards.updateBlobs(w);
    touchEnemies(w);
    touchPickups(w);
    updateCamera(w);
    checkEncounters(w);
    return w.events;
  }

  function emit(w, type, extra) {
    var e = { type: type };
    if (extra) for (var k in extra) e[k] = extra[k];
    w.events.push(e);
  }

  function hasEvent(w, type) {
    for (var i = 0; i < w.events.length; i++) if (w.events[i].type === type) return true;
    return false;
  }

  function updateLasers(w) {
    for (var i = w.lasers.length - 1; i >= 0; i--) {
      var l = w.lasers[i];
      l.x += l.vx;
      l.dist += Math.abs(l.vx);
      if (l.targetY !== undefined) l.y += (l.targetY - l.y) * 0.15;
      var damage = l.kind === 'rocket' ? MR.Player.C.ROCKET_DAMAGE : 1;
      var gone = l.dist > MR.Player.C.LASER_RANGE || l.x + l.w < 0 || l.x > w.width ||
        MR.Physics.overlapsAny(l, w.solids);
      if (!gone) {
        for (var j = 0; j < w.enemies.length; j++) {
          var e = w.enemies[j];
          if (!e.alive || !MR.Physics.overlaps(l, e)) continue;
          gone = true;
          for (var d = 0; d < damage && e.alive; d++) hitEnemy(w, e);
          if (l.kind === 'rocket') burst(w, l.x + l.w / 2, l.y + l.h / 2, 10);
          break;
        }
      }
      if (!gone) gone = laserHitsBoss(w, l, damage) || laserHitsPie(w, l) || hitsFireball(w, l);
      if (gone) w.lasers.splice(i, 1);
    }
  }

  function laserHitsBoss(w, l, damage) {
    var b = w.boss;
    if (!b || !b.alive || !MR.Physics.overlaps(l, b)) return false;
    for (var d = 0; d < (damage || 1); d++) hitBoss(w);
    return true;
  }

  // One hit on the boss; beating him reveals what he was guarding.
  function hitBoss(w) {
    var b = w.boss;
    if (!b.alive) return;
    if (MR.Boss.hit(b)) {
      emit(w, 'pop');
      emit(w, 'bossDefeated');
      burst(w, b.x + b.w / 2, b.y + b.h / 2, 40);
      w.pies = [];
      w.tornadoes = [];
      w.fireballs = [];
      w.waves = [];
      // Whatever the boss was guarding appears (4 Bunny's carrot), or is
      // set free (4 Bunny himself).
      w.pickups.forEach(function (pk) { pk.hidden = false; pk.locked = false; });
    } else {
      emit(w, 'hit');
    }
  }

  // Anything Man Ray or Spiky fires can knock a fireball out of the water.
  function hitsFireball(w, shot) {
    for (var i = 0; i < w.fireballs.length; i++) {
      var f = w.fireballs[i];
      if (!MR.Physics.overlaps(shot, f)) continue;
      burst(w, f.x + f.w / 2, f.y + f.h / 2, 8);
      w.fireballs.splice(i, 1);
      emit(w, 'pop');
      return true;
    }
    return false;
  }

  // Spiky's spikes: one hit each on helpers, the boss, pies and fireballs.
  function updateSpikes(w) {
    for (var i = w.spikes.length - 1; i >= 0; i--) {
      var s = w.spikes[i];
      s.x += s.vx; s.y += s.vy; s.life--;
      var gone = s.life <= 0 || s.x + s.w < 0 || s.x > w.width || MR.Physics.overlapsAny(s, w.solids);
      for (var j = 0; j < w.enemies.length && !gone; j++) {
        var e = w.enemies[j];
        if (e.alive && MR.Physics.overlaps(s, e)) { hitEnemy(w, e); gone = true; }
      }
      if (!gone && w.boss && w.boss.alive && w.boss.active && MR.Physics.overlaps(s, w.boss)) { hitBoss(w); gone = true; }
      if (!gone) gone = laserHitsPie(w, s) || hitsFireball(w, s);
      if (gone) w.spikes.splice(i, 1);
    }
  }

  // One hit on a helper.
  function hitEnemy(w, e) {
    if (MR.Enemies.hit(e)) {
      emit(w, 'pop');
      burst(w, e.x + e.w / 2, e.y + e.h / 2, 14);
    } else {
      emit(w, 'hit');
    }
  }

  // Mega Punch upgrade: anything that comes close in front of Man Ray gets
  // a big boxing-glove punch (it runs before touching hurts him).
  function updatePunch(w) {
    var p = w.player, C = MR.Player.C;
    if (p.punchAnim > 0) p.punchAnim--;
    if (p.punchCooldown > 0) { p.punchCooldown--; return; }
    var zone = {
      x: p.facing > 0 ? p.x + p.w - 6 : p.x - C.PUNCH_RANGE + 6,
      y: p.y + 4, w: C.PUNCH_RANGE, h: p.h - 8
    };
    var target = null, i;
    for (i = 0; i < w.enemies.length && !target; i++) {
      if (w.enemies[i].alive && MR.Physics.overlaps(zone, w.enemies[i])) target = w.enemies[i];
    }
    var boss = w.boss && w.boss.alive && w.boss.active && MR.Physics.overlaps(zone, w.boss);
    var pieIndex = -1;
    for (i = 0; i < w.pies.length && pieIndex < 0; i++) if (MR.Physics.overlaps(zone, w.pies[i])) pieIndex = i;
    if (!target && !boss && pieIndex < 0) return;

    p.punchAnim = C.PUNCH_ANIM_TICKS;
    p.punchCooldown = C.PUNCH_COOLDOWN;
    emit(w, 'punch');
    var px = zone.x + (p.facing > 0 ? zone.w - 10 : 10), py = p.y + p.h / 2 - 8;
    w.popups.push({ x: px, y: py - 30, text: 'POW!', life: 40, max: 40 });
    if (target) {
      for (i = 0; i < C.PUNCH_DAMAGE && target.alive; i++) hitEnemy(w, target);
      if (target.alive) {
        // Knock it back a little.
        target.vx = p.facing * 30; target.vy = 0;
        if (target.type === 'fish') target.x += target.vx;
        else MR.Physics.moveAndCollide(target, w.solids);
        target.vx = 0;
      }
    } else if (boss) {
      for (i = 0; i < C.PUNCH_DAMAGE; i++) hitBoss(w);
    } else {
      var pie = w.pies.splice(pieIndex, 1)[0];
      burst(w, pie.x + pie.w / 2, pie.y + pie.h / 2, 6);
    }
  }

  // Sausage Cowboy Hat upgrade: a sausage dog swims along behind Man Ray
  // and chases off any fish or crab that comes near.
  function updateDog(w) {
    var d = w.dog, p = w.player;
    var pcx = p.x + p.w / 2, pcy = p.y + p.h / 2;
    d.frame++;
    if (d.cooldown > 0) d.cooldown--;

    if (d.state === 'follow' && d.cooldown <= 0) {
      var best = null, bestDist = DOG.CHASE_RANGE;
      w.enemies.forEach(function (e) {
        if (!e.alive || (e.type !== 'fish' && e.type !== 'crab') || !onScreen(w, e)) return;
        var dist = Math.abs(e.x + e.w / 2 - pcx) + Math.abs(e.y + e.h / 2 - pcy) * 0.5;
        if (dist < bestDist) { best = e; bestDist = dist; }
      });
      if (best) { d.state = 'chase'; d.target = best; }
    }

    var tx, ty, speed;
    if (d.state === 'chase') {
      var e = d.target;
      if (!e.alive || Math.abs(e.x - p.x) > DOG.GIVE_UP) {
        d.state = 'follow'; d.target = null;
        return;
      }
      tx = e.x + e.w / 2; ty = e.y + e.h / 2; speed = DOG.SPEED;
    } else {
      tx = pcx - p.facing * 64; ty = p.y + p.h - 14; speed = 0;
    }
    var dx = tx - (d.x + d.w / 2), dy = ty - (d.y + d.h / 2);
    if (speed) {
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var step = Math.min(speed, dist);
      d.x += dx / dist * step; d.y += dy / dist * step;
    } else {
      d.x += dx * 0.08; d.y += dy * 0.08;
    }
    if (Math.abs(dx) > 1) d.facing = dx < 0 ? -1 : 1;

    if (d.state === 'chase' && MR.Physics.overlaps(d, MR.Physics.shrink(d.target, 2))) {
      var t = d.target;
      t.alive = false;
      burst(w, t.x + t.w / 2, t.y + t.h / 2, 12);
      w.popups.push({ x: t.x + t.w / 2, y: t.y - 10, text: 'Woof!', life: 50, max: 50 });
      emit(w, 'woof');
      d.state = 'follow'; d.target = null; d.cooldown = DOG.COOLDOWN;
    }
  }

  function laserHitsPie(w, l) {
    for (var i = 0; i < w.pies.length; i++) {
      var pie = w.pies[i];
      if (!MR.Physics.overlaps(l, pie)) continue;
      burst(w, pie.x + pie.w / 2, pie.y + pie.h / 2, 6);
      w.pies.splice(i, 1);
      emit(w, 'pop');
      return true;
    }
    return false;
  }

  function touchEnemies(w) {
    var p = w.player;
    if (p.invuln > 0) return;
    // Slightly smaller boxes so near-misses feel fair.
    var body = MR.Physics.shrink(p, 6);
    var i;
    for (i = 0; i < w.enemies.length; i++) {
      var e = w.enemies[i];
      if (e.alive && MR.Physics.overlaps(body, MR.Physics.shrink(e, 4))) return hurtPlayer(w, e.x + e.w / 2);
    }
    var b = w.boss;
    if (b && b.alive && MR.Physics.overlaps(body, MR.Physics.shrink(b, 8))) return hurtPlayer(w, b.x + b.w / 2);
    for (i = 0; i < w.pies.length; i++) {
      var pie = w.pies[i];
      if (!MR.Physics.overlaps(body, pie)) continue;
      w.pies.splice(i, 1);
      return hurtPlayer(w, pie.x + pie.w / 2);
    }
    for (i = 0; i < w.tornadoes.length; i++) {
      var tw = w.tornadoes[i];
      if (MR.Physics.overlaps(body, MR.Physics.shrink(tw, 8))) return hurtPlayer(w, tw.x + tw.w / 2);
    }
    // God of the Zillas' fireballs and stomp shockwaves
    for (i = 0; i < w.fireballs.length; i++) {
      var f = w.fireballs[i];
      if (!MR.Physics.overlaps(body, MR.Physics.shrink(f, 4))) continue;
      w.fireballs.splice(i, 1);
      return hurtPlayer(w, f.x + f.w / 2);
    }
    for (i = 0; i < w.waves.length; i++) {
      var wv = w.waves[i];
      if (MR.Physics.overlaps(body, MR.Physics.shrink(wv, 4))) return hurtPlayer(w, wv.x + wv.w / 2);
    }
    // Lava: the column out of an erupting volcano, and the flying blobs.
    for (i = 0; i < w.hazards.length; i++) {
      var lava = MR.Hazards.lavaRect(w.hazards[i]);
      if (lava && MR.Physics.overlaps(body, lava)) return hurtPlayer(w, w.hazards[i].cx);
    }
    for (i = 0; i < w.lavaBlobs.length; i++) {
      var blob = w.lavaBlobs[i];
      if (!MR.Physics.overlaps(body, blob)) continue;
      w.lavaBlobs.splice(i, 1);
      return hurtPlayer(w, blob.x + blob.w / 2);
    }
  }

  function hurtPlayer(w, fromX) {
    var p = w.player;
    MR.Player.hurt(p, fromX);
    emit(w, 'hurt');
    if (p.hearts <= 0) {
      burst(w, p.x + p.w / 2, p.y + p.h / 2, 18);
      MR.Player.respawn(p, w.checkpoint);
      w.lasers = [];
      w.pies = [];
      w.tornadoes = [];
      w.lavaBlobs = [];
      w.fireballs = [];
      w.waves = [];
      snapCamera(w);
      emit(w, 'respawn');
    }
  }

  function touchPickups(w) {
    var p = w.player;
    for (var i = 0; i < w.pickups.length; i++) {
      var pk = w.pickups[i];
      MR.Pickups.update(pk);
      if (pk.collected || pk.hidden || !MR.Physics.overlaps(p, pk)) continue;
      var result = MR.Pickups.collect(pk, w);
      if (result) emit(w, result);
      if (result === 'pling') burst(w, pk.cx, pk.cy, 4);
      if (result === 'golden') {
        burst(w, pk.cx, pk.cy, 12);
        w.popups.push({ x: pk.cx, y: pk.cy - 20, text: '+' + MR.Pickups.GOLDEN_VALUE, life: 70, max: 70 });
      }
    }
  }

  function onScreen(w, e) {
    var cx = e.x + e.w / 2;
    return cx > w.camera.x + ENCOUNTER_MARGIN && cx < w.camera.x + VIEW_W - ENCOUNTER_MARGIN;
  }

  function checkEncounters(w) {
    for (var i = 0; i < w.enemies.length; i++) {
      var e = w.enemies[i];
      if (!e.alive || w.seenEnemyTypes[e.type] || !onScreen(w, e)) continue;
      w.seenEnemyTypes[e.type] = true;
      emit(w, 'encounter', { enemy: e.type });
    }
    for (var h = 0; h < w.hazards.length; h++) {
      var hz = w.hazards[h];
      if (w.seenEnemyTypes[hz.type] || !onScreen(w, hz)) continue;
      w.seenEnemyTypes[hz.type] = true;
      emit(w, 'encounter', { enemy: hz.type });
    }
    // The boss wakes up the first time he comes on screen.
    var b = w.boss;
    if (b && b.alive && !b.active && onScreen(w, b)) {
      b.active = true;
      emit(w, 'encounter', { enemy: b.type });
    }
  }

  function cameraTarget(w) {
    var p = w.player;
    var target = p.x + p.w / 2 - VIEW_W / 2 + p.facing * LOOK_AHEAD;
    return Math.max(0, Math.min(target, w.width - VIEW_W));
  }

  function updateCamera(w) {
    w.camera.x += (cameraTarget(w) - w.camera.x) * CAMERA_EASE;
  }

  function snapCamera(w) {
    w.camera.x = cameraTarget(w);
  }

  function burst(w, x, y, n) {
    for (var i = 0; i < n; i++) {
      w.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 3.5,
        vy: -Math.random() * 2 - 0.4,
        r: 3 + Math.random() * 6,
        life: 50 + Math.random() * 30,
        max: 80
      });
    }
  }

  function finBubbles(w) {
    var p = w.player;
    for (var i = 0; i < 3; i++) {
      w.particles.push({
        x: p.x + p.w / 2 - p.facing * 14 + (Math.random() - 0.5) * 16,
        y: p.y + p.h - 4,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.4 - Math.random() * 0.6,
        r: 2 + Math.random() * 3,
        life: 40, max: 40
      });
    }
  }

  function updateParticles(w) {
    for (var j = w.popups.length - 1; j >= 0; j--) {
      w.popups[j].y -= 0.6;
      if (--w.popups[j].life <= 0) w.popups.splice(j, 1);
    }
    for (var i = w.particles.length - 1; i >= 0; i--) {
      var pt = w.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.96;
      pt.vy -= 0.03;
      pt.life--;
      if (pt.life <= 0) w.particles.splice(i, 1);
    }
  }

  return { VIEW_W: VIEW_W, DOG: DOG, create: create, step: step, snapCamera: snapCamera };
})();
